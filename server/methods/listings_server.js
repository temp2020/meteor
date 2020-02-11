import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { canEdit } from '../../lib/components/publish-date';
import _ from 'underscore';

Meteor.methods({
  //Upload new listing.  Update listing count.
  'postListing': function( newListing ) {
      check(this.userId, String);
      check(newListing, {
        title: String,
        productID: Match.OneOf(String, null),
        sellPrice: Number,
        condition: String,
        conditionType: Match.OneOf(String, null),
        meetLocation: Match.OneOf(String, null),
        listingNotes: Match.OneOf(String, null),
        moreDetails: Match.OneOf(String, null),
        isPublished: Boolean
      });

        const postDate = new Date();

        let userPack = UserPack.findOne({ userId: this.userId });

        let expiryTime = postDate.getTime() + (3600000 * 24 * userPack.expiryDays);

        let limit = userPack.listings;

        let self = this;

        let currentCount = activeListingCount(this.userId, postDate)
                
        if( currentCount >= limit && newListing.isPublished ){
          throw new Meteor.Error('Limit Exceeded');
        }

      let userCoords = [0,0];
      let userhasCoords = false;

      let profile = Profile.findOne({ profID: this.userId });
      let mystore = Stores.findOne({ userId: this.userId });

      if ( profile.hasLocation === true ){
          userCoords = profile.location.coordinates;
          userhasCoords = true;
      }

        let listing = _.extend(newListing, {
          views: 0,
          listOfferCount: 0,
          storeId: mystore._id,
          postDate,
          firstPublishDate: newListing.isPublished ? postDate : null,
          lastPublishDate: newListing.isPublished ? postDate : null,
          expiryDate: userPack.expiryDays !== 0 && newListing.isPublished 
            ? new Date(expiryTime) 
            : null,
          totalPublishedTime: 0,
          country: profile.location.countryCode,
          sold: false,
          soldInfo: {
            soldPrice: null,
            soldDate: null
          },
          images: [],
          active: true,
          listedBy: this.userId,
          seller: Meteor.user().username,
          hasLocation: userhasCoords,
          location:{
            type: 'Point',
            coordinates: userCoords,
          },
          currency: profile.currency ? profile.currency : 'EUR'
        });

      return Listings.insert(listing, function(err, listingId){

          if(err){
            return;
          }

          if (!listing.isPublished) {
            return;
          } 
          
          if ( listing.productID ) {
            Products.update({ _id: listing.productID },{ $inc: { listingsCount: 1 }} );
          }
          
          Profile.update({ _id: profile._id}, { $inc: {myListings: 1}} );

          Stores.update({ _id: mystore._id },{ 
            $inc: { 
              listingsCount: 1 
            },
            $set:{
              lastPost: new Date()
            }
          });

          updateCardLevel(self.userId, listingId);

        
      });
  },

  //Upload changes to listing.
  'updateListing': function(postId, productId, updateListing) {
      check(this.userId, String);
      check(postId, String);
      check(productId, Match.OneOf(String, null));
      check(updateListing, {
        title: String,
        sellPrice: Number,
        condition: String,
        conditionType: Match.OneOf(String, null),
        meetLocation: Match.OneOf(String, null),
        listingNotes: Match.OneOf(String, null),
        moreDetails: Match.OneOf(String, null)
      });
      
      /*
      const listing = Listings.findOne({ _id: postId });
      
      if ( listing.firstPublishDate && !canEdit(listing.firstPublishDate) ) {
        throw new Meteor.Error('Cannot edit or delete for 6 hours');
      }
      */

      let profile = Profile.findOne({ profID: this.userId });

      let update = updateListing;

      update.currency = profile.currency ? profile.currency : 'EUR';

      if( profile.hasLocation === true ){
        update = _.extend(update,{
          hasLocation: true,
          location: {
            type: 'Point',
            coordinates: [
              profile.location.coordinates[0],
              profile.location.coordinates[1]
            ]
          }
        });
      }

      return Listings.update({
        _id: postId,
        listedBy: this.userId
      },{
        $set: update
      });
  },

  //Upload images of listing.
  'insertImage': function(listId, imgId) {
      check(this.userId, String);
      check(listId, String);
      check(imgId, String);

      Uploads.collection.update({ _id: imgId },{ $set:{ 'meta.userId': this.userId  }});

      return Listings.update({
        _id: listId,
        listedBy: this.userId
      },{
        $push: {
          images: imgId
        }
      });
  },

  //Remove uploaded image, and update the Listing.
  'removeUpload': function(listId, imgId) {
    check(this.userId, String);
    check(imgId, String);
    check(listId, String);

    Listings.update({
        _id: listId,
        listedBy: this.userId
      },{
        $pull: { images: imgId }
      });
    Uploads.remove({ _id: imgId, 'meta.userId': this.userId });
  },

  'deleteImage': function(imageId){
    check(this.userId, String);
    check(imageId, String);

    Uploads.remove({ _id: imageId, 'meta.userId': this.userId });
  },

  'checkListingCount': function(){
    check(this.userId, String);
    
    let userPack = UserPack.findOne({ userId: this.userId });

    let limit = userPack.listings;

    let currentCount = Listings.find({
      listedBy: this.userId,
      active: true,
      isPublished: true,
      $or:[{ 
        expiryDate: {
          $gt: new Date()
        }
      },{
        expiryDate: null
      }]
    }).count();

    if( currentCount >= limit ){
      return false;
    }
    else {
      return true;
    }
    
  },
  'updateProductCounts': function(){
    Products.find({
      listingsCount:{
        $gt: 0
      }
    }).forEach( function(product){

      let listings = Listings.find({
        productID: product._id,
        active: true,
        isPublished: true,
        $or:[{ 
          expiryDate: {
            $gt: new Date()
          }
        },{
          expiryDate: null
        }]
      }).count();

      if( product.listingsCount !== listings ){
        
        Products.update({
          _id: product._id
        },{
          $set:{
            listingsCount: listings
          }
        });

      }
    });
  },
  
  'updateStoresCounts': function(){
    Stores.find({
      listingsCount:{
        $gt: 0
      }
    }).forEach( function(store){

      let listings = Listings.find({
        storeId: store._id,
        active: true,
        isPublished: true,
        $or:[{ 
          expiryDate: {
            $gt: new Date()
          }
        },{
          expiryDate: null
        }]
      }).count();

      if( store.listingsCount !== listings ){
        
        Stores.update({
          _id: store._id
        },{
          $set:{
            listingsCount: listings
          }
        });

      }
    });
  },
  'clearExpired': function(){

    let expiredListings = Listings.find({
      active: true,
      isPublished: true,
      expiryDate: {
        $lte: new Date()
      } 
    });

    if( expiredListings.count() > 0 ){

      expiredListings.forEach(function(listing){

        Listings.update({ 
          _id: listing._id 
        },{
          $set: {
            active: false
          }
        }, function(err){
          if( !err ){

            if( listing.images.length > 0 ){
              listing.images.forEach(function(imageId){
                
                Uploads.remove({ _id: imageId });
              
              });
            }

            let offers = Offers.find({ listingID: listing._id });
            let follows = Follows.find({ listingId: listing._id });

            if( offers.count() > 0 ){
              offers.forEach(function(offer){
                Offers.remove({ _id: offer._id })
              });
            }

            if( follows.count() > 0 ){
              follows.forEach(function(follow){
                Follows.remove({ _id: follow._id })
              });
            }

          }
        });

      });
    }

  },
  'publish': function(listingId) {
    check(this.userId, String);
    check(listingId, String);

    const self = this;

    const listing = Listings.findOne({ _id: listingId, listedBy: this.userId });

    if ( !listing ) {
      return;
    }

    if ( listing.firstPublishDate && !canEdit(listing.firstPublishDate) ) {
      throw new Meteor.Error('Cannot Edit', 'Cannot edit or delete this listing for 6 hours');
    }
    
    const userPack = UserPack.findOne({ userId: this.userId });

    const toPublish = listing.isPublished ? false : true;

    const isFirstPublish = toPublish && !listing.firstPublishDate;

    const currentDate = new Date();

    let currentCount = activeListingCount(this.userId, currentDate)
                
    if( currentCount >= userPack.listings && toPublish ){
      throw new Meteor.Error('Limit Exceeded');
    }

    const totalPublishedTime = getTotalTimePublished({
      toPublish,
      lastPublishDate: listing.lastPublishDate, 
      currentDate, 
      totalPublishedTime: listing.totalPublishedTime
    });
    
    const expiryDate = newExpiryDate({
      toPublish, 
      isFirstPublish,
      lastPublishDate: listing.lastPublishDate, 
      currentDate, 
      expiryDays: userPack.expiryDays, 
      totalPublishedTime: listing.totalPublishedTime
    });
  
    return Listings.update({
      _id: listingId
    },{
      $set: {
        isPublished: toPublish,
        firstPublishDate: isFirstPublish ? currentDate : listing.firstPublishDate,
        lastPublishDate: toPublish ? currentDate : listing.lastPublishDate,
        totalPublishedTime,
        expiryDate
      }
    }, function(err) {

      if(err) {
        return;
      }

      const count = toPublish ? 1 : -1;

      const profile = Profile.findOne({ profID: self.userId });

      const mystore = Stores.findOne({ userId: self.userId });

      if ( listing.productID ) {
        Products.update({ _id: listing.productID },{ $inc: { listingsCount: count }} );
      }
      
      Profile.update({ _id: profile._id}, { $inc: { myListings: count }} );

      Stores.update({ _id: mystore._id },{ 
        $inc: { 
          listingsCount: count
        },
        $set:{
          lastPost: new Date()
        }
      });

      if (isFirstPublish) {
        updateCardLevel(self.userId, listingId);
      }
      
    });

  }
});

function activeListingCount(userId, postDate) {
  return Listings.find({
    listedBy: userId,
    active: true,
    isPublished: true,
    $or:[{ 
      expiryDate: {
        $gt: postDate
      }
    },{
      expiryDate: null
    }]
  }).count();
}

function updateCardLevel(userId, listingId){

  const userCards = UserCards.findOne({ userId });

  let updatedLevel = userCards.level;

  let limit = 1;

  if (userCards.level === 3) {
    
    limit = 2;

  } else if (userCards.level === 4) {
    
    limit = 3;

  } else if (userCards.level === 5) {

    limit = 5;

  };

  const listings = Listings.find({ 
    listedBy: userId,
    $and:[{ 
      firstPublishDate: {
        $gte: userCards.lastUpdate
      }
    },{
      firstPublishDate: { 
        $ne: null 
      }
    }]
  },{
    sort:{
      firstPublishDate: -1
    },
    limit
  })
  .fetch();
  
  if(userCards.level === 0 && listings.length >= 1){

    updatedLevel += 1;

  } else {
    
    const canUpgrade = canUpgradeCard(userCards.level, listings.length);

    updatedLevel += canUpgrade ? 1 : 0;

    if(updatedLevel > 6){
      updatedLevel = 6;
    }
  } 

  if(updatedLevel === userCards.level){
    addCoins(userId, updatedLevel)
    return;
  }

  return UserCards.update({
    userId
  },{
    $set: {
      latestListingId: listingId,
      cardExpiryApplied: false,
      lastUpdate: new Date(),
      level: updatedLevel,
      baseLevel: updatedLevel
    }
  }, function(err){
    if(!err){
      addCoins(userId, updatedLevel);
    }
  });
}

function addCoins(userId, level){

  if(!level){
    return;
  }

  const card = Cards.findOne({ level });

  const coins = Coins.findOne({ userId });

  return Coins.update({ 
    _id: coins._id 
  },{
    $inc:{
      quantity: card.coins
    }
  });
}

function canUpgradeCard(cardLevel, length){
  return (cardLevel > 0 && cardLevel < 3 && length >= 1) ||
    (cardLevel === 3 && length >= 2) ||
    (cardLevel === 4 && length >= 3) ||
    (cardLevel === 5 && length >= 5)
};

function getTotalTimePublished({ toPublish, lastPublishDate, currentDate, totalPublishedTime }) {
  
  if ( toPublish ) {
    return totalPublishedTime
  }
  
  if ( !lastPublishDate ) {
    return 0;
  }

  return currentDate.getTime() - lastPublishDate.getTime() + totalPublishedTime;
}

function newExpiryDate({ toPublish, isFirstPublish, lastPublishDate, currentDate, expiryDays, totalPublishedTime }) {

  if ( expiryDays === 0 || !toPublish ) {
    return null;
  }

  let publishDate;

  const expiryTime = 3600000 * 24 * expiryDays;

  if (isFirstPublish) {
    publishDate = currentDate.getTime() + expiryTime;
    return new Date(publishDate);
  }

  publishDate = lastPublishDate ? lastPublishDate.getTime() : currentDate.getTime();

  publishDate += expiryTime - totalPublishedTime;

  return new Date(publishDate);
}