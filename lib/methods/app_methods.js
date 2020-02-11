import { Meteor } from 'meteor/meteor';
import buildRegExp from '../components/searchRegex';
import _ from 'underscore';
import { searchCardDistance } from '../components/search-card-distance';

Meteor.methods({

  //Return count of all Products in server.
  'allProducts': function() {
    return Products.find({ listingsCount: { $gt: 0 } }).count();
  },

  //Return count of all Products in server.
  'allStores': function(search, coordinates) {
    check( search, Match.Maybe(String) );
    check( coordinates, Match.OneOf(null, [Number]) );
    
    let listingIds = [];

    let selector = {
      listingsCount: { 
        $gt: 0 
      },
      active: true
    }

    if(search){
                
      let listings = [];

      if (coordinates) {

        let listingSelector = {
          title: buildRegExp(search),
          active: true,
          isPublished: true,
          hasLocation: true,
          location: {
            $geoWithin: {
              $centerSphere: [
                [ coordinates[0], coordinates[1] ],
                maxDistance / 6371
              ]
            }
          },
          $or:[{ 
            expiryDate: {
              $gt: new Date()
            }
          },{
            expiryDate: null
          }]
        };

        let user = null;
    
        if (this.userId) {
          user = Profile.findOne({ profID: this.userId });
        }
    
        if( user && user.location && user.location.countryCode ) {
          listingSelector.country = user.location.countryCode;
        }

        listings = Listings.find(
          listingSelector,
          {
            fields: {
              storeId: true
            },
          }
        ).fetch();
      
      }
      
      if(listings.length > 0){
      
        listingIds = listings.map( listing => { return listing.storeId });
      
        listingIds = _.uniq(listingIds);
      
        selector = {
          $or:[{ 
            name: buildRegExp(search)
          },{ 
            _id: {
              $in: listingIds
            } 
          }],
          listingsCount: { 
            $gt: 0 
          },
          active: true
        }
      }
      else{
      
        selector.name = buildRegExp(search);
      
      }
    }

    return {
      count: Stores.find(selector).count(),
      listingIds: listingIds
    }
  },

  //Return count of all Products in server.
  'productSelect': function() {
    return Products.find({}).count();
  },  

  //Return count of all Listings of the same Product in server.
  'allPosts': function(type, groupId, options) {
    check(type, String);
    check(options, {
      loaded: Number,
      skip: Number,
      distance: Match.OneOf(null, Number),
      coordinates: Match.OneOf(null, [Number]),
      sort: String,
      minPrice: Match.OneOf(null, Number),
      maxPrice: Match.OneOf(null, Number),
      condition: [String],
      search: Match.Optional(String),
      sameCurrency: Boolean
    });

    if( type === 'store' && type === 'category' ){
      check(groupId, String);
    }

    if( type !== 'store' && type !== 'category' && type !== 'follow' && type !== 'search' ){
      throw new Meteor.Error('Invalid Type')
    }

    if (!options.coordinates) {
      throw new Meteor.Error('GPS Required');
    }
    
    let user;

    const maxDistance = searchCardDistance(this.userId);

    if (this.userId) {
      user = Profile.findOne({ profID: this.userId });
    }

    let selector = {
      active: true,
      isPublished: true,
      $or:[{ 
        expiryDate: {
          $gt: new Date()
        }
      },{
        expiryDate: null
      }]
    }

    if( !options.distance || options.distance > maxDistance ) {
      options.distance = maxDistance;
    }
  
    if( user && user.location && user.location.countryCode ) {
      selector.country = user.location.countryCode;
    }
  
    if( type === 'category' ){
      selector.productID = groupId;
    }
    else if( type === 'store' ){
      selector.storeId = groupId;
    }
    else if(type === 'follow'){
      let listingIds = [];
  
      let follows = Follows.find({
        userId: this.userId,
      },{
        fields: {
          listingId: true
        }
      });
      
      listingIds = follows.map( follow => { return follow.listingId });
      
      listingIds = _.uniq(listingIds);
  
      selector._id = {
        $in: listingIds
      }
    }

    if( options.search ){
      selector.title = buildRegExp(options.search);
    }
  
    if( options.condition.length > 0 ){
      selector.condition = {
        $in: options.condition
      }
    }
  
    if( options.minPrice && !options.maxPrice  ){
      selector.sellPrice = {
        $gte: options.minPrice
      }
    }
  
    if( !options.minPrice && options.maxPrice ){
      selector.sellPrice = {
        $lte: options.maxPrice
      }
    }
  
    if( options.minPrice && options.maxPrice ){
      selector.sellPrice = {
        $gte: options.minPrice,
        $lte: options.maxPrice
      }
    }

    if ( options.distance !== null && options.coordinates !== null ){
      selector = _.extend(selector,{
        location: {
          $geoWithin: {
            $centerSphere: [
              [ options.coordinates[0], options.coordinates[1] ],
              options.distance / 6371
            ]
          }
        }
      });

      if(Meteor.isServer){
        return Listings.find(selector).count();
      }
    }
    else {
      return Listings.find(selector).count();
    }

  },

  //Return count of all active Listings in server.
  'allListings': function() {
    return Listings.find({ 
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
  },

  //Return count of all Listings that user has posted.
  'myAllPosts': function() {
    return Listings.find({ 
      listedBy: this.userId, 
      active: true,
      $or:[{ 
        expiryDate: {
          $gt: new Date()
        }
      },{
        expiryDate: null
      }]
    }).count();
  },

  //Return count of all offers by user.
  'allOffers': function() {
    return Offers.find({ offerBy: this.userId }).count();
  },

  'allFollowed': function() {
    
    let follows = Follows.find({ userId: this.userId });

    let listingIds = follows.fetch().map(function(listing){
      return listing.listingId;
    });

    return Listings.find({ 
      _id:{
        $in: listingIds
      },
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
  },

  'allFavorites': function(search, coordinates) {
    check( search, Match.Maybe(String) );
    check( coordinates, Match.OneOf(null, [Number]) );
    
    let listingIds = [];

    let favorites = Favorites.find({ userId: this.userId });

    let storeIds = favorites.fetch().map(favorite => { return favorite.storeId; });

    let selector = { 
      _id:{
        $in: storeIds
      },
      listingsCount: { 
        $gt: 0 
      },
      active: true
    }

    if(search){
      
      let listings = [];

      if (coordinates) {
        
        const maxDistance = searchCardDistance(this.userId);

        let listingSelector = {
          title: buildRegExp(search),
          storeId:{
            $in: storeIds
          },
          active: true,
          isPublished: true,
          hasLocation: true,
          location: {
            $geoWithin: {
              $centerSphere: [
                [ coordinates[0], coordinates[1] ],
                maxDistance / 6371
              ]
            }
          },
          $or:[{ 
            expiryDate: {
              $gt: new Date()
            }
          },{
            expiryDate: null
          }]
        };

        let user = null;
    
        if (this.userId) {
          user = Profile.findOne({ profID: this.userId });
        }
    
        if( user && user.location && user.location.countryCode ) {
          listingSelector.country = user.location.countryCode;
        }

        listings = Listings.find(
          listingSelector,
          {
            fields: {
              storeId: true
            },
          }
        ).fetch();
      }
      
      if( listings.length > 0 ){
        
        listingIds = listings.map( listing => { return listing.storeId });
        
        listingIds = _.uniq(listingIds);

        selector = {
          $or:[{
            name: buildRegExp(search),
            _id:{
              $in: storeIds
            }
          },{
            _id: {
              $in: listingIds
            }
          }], 
          listingsCount: { 
            $gt: 0 
          },
          active: true
        }
      }
      else{

        selector.name = buildRegExp(search);

      }
    }

    return {
      count: Stores.find(selector).count(),
      listingIds: listingIds
    };
  },  

  //Return count of all activity feeds to user.
  'allFeeds': function() {
    return Feeds.find({ userID: this.userId }).count();
  },

  //Return count of all Chats of user.
  'allChats': function() {
    return ChatRoom.find({  
      $or: [{
        buyer: this.userId, buyerActive: true },{
        seller: this.userId, sellerActive: true
      }]
    }).count();
  },

  //Return count of all Messages in the chat.
  'allMsg': function(chatid) {
    check(chatid, String);
    return Messages.find({ sentBy: { $ne: 'system' }, chatID: chatid }).count();
  },

  //Return count of all Listings posted by selected user.
  'allUserPosts': function(profileId) {
    check(profileId, String);
    let prof = Profile.findOne({ _id: profileId });

    return Listings.find({ 
      listedBy: prof.profID, 
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
  },

  //Return count of all Feedback posted for the user.
  'allFeedback': function(profileId) {
    if(!profileId) {
      return;
    }
    check(profileId, String);
    let prof = Profile.findOne({ _id: profileId });
    return Feedback.find({ user: prof.profID }).count();
  },

  'allOffersReceived': function() {
    if(!this.userId) {
      return;
    }
    check(this.userId, String);

    return Offers.find({ seller: this.userId }).fetch();
  }

});
