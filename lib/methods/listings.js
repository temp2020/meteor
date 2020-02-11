import { Meteor } from 'meteor/meteor';
import { canEdit } from '../components/publish-date';

Meteor.methods({
    //Change selling price of listing.
    'changePrice': function(listID, newAmount) {
        check(this.userId, String);
        check(listID, String);
        check(newAmount, Number);
        
        const listing = Listings.findOne({ _id: listID });

        if ( listing.firstPublishDate && !canEdit(listing.firstPublishDate) ) {
          throw new Meteor.Error('Cannot edit or delete for 6 days');
        }

        Listings.update({
          _id: listID, listedBy: this.userId
        },{
          $set: { sellPrice: newAmount }
        },{
          upsert: false
        });
    },

    //Remove Listing, including Offers for that Listing.  Update listing counts.
    'removeListing': function(listID) {
        check(this.userId, String);
        check(listID, String);
        let self = this;

        let thisPost = Listings.findOne({ _id: listID, listedBy: this.userId });
        
        if ( thisPost.firstPublishDate && !canEdit(thisPost.firstPublishDate) ) {
          throw new Meteor.Error('Cannot edit or delete for 6 days');
        }

        let profile = Profile.findOne({ profID: this.userId });
        let offers = Offers.find( {listingID: thisPost._id} ).count();
        let follows = Follows.find({ listingId: thisPost._id });

        Listings.update({ 
          _id: thisPost._id, 
          listedBy: this.userId 
        },{ 
          $set: { 
            active: false 
          } 
        },function(err){
          if(!err){
            
            if(thisPost.productID) {
              Products.update( {_id: thisPost.productID}, {$inc: { listingsCount: -1 } } );
            }
            
            Profile.update( {_id: profile._id}, {$inc: { myListings: -1 } } );
            Stores.update({ userId: self.userId },{ $inc: { listingsCount: -1 }} );
            Follows.remove({ _id: follow._id });
            
            if ( offers !== 0 ){
                Offers.find({listingID: thisPost._id}).forEach( function(thisoffer) {
                
                    //Method is located at tapshop/lib/methods/offers.js
                    Meteor.call( 'removeOffers', thisoffer._id, thisPost._id, thisPost.productID );
                
                    //Method is located at tapshop/server/methods/feed_server.js
                    Meteor.call( 'insertFeed', 'removePost', thisoffer.offerBy, thisPost.title, null );
                });
            }

            if( follows.count() > 0 ){
              follows.forEach( function(follow){
                Follows.remove({ _id: follow._id });
              });
            }

            if( thisPost.images.length > 0 ){

              thisPost.images.forEach( function(image){
                Meteor.call('deleteImage', image);
              });

            }
          }
        });
    },

    //Update Listing as sold, and remove all existing offers for the Listing.  Update all Listing counts.
    'soldListing': function(listID, chatID){
            check(this.userId, String);
            check(listID, String);
            check(chatID, String);
            
            let thisListing = Listings.findOne({_id: listID, listedBy: this.userId });
            let profile = Profile.findOne({ profID: this.userId });
            let chat = ChatRoom.findOne({ _id: chatID, listingID: listID, seller: this.userId });
            let follows = Follows.find({ listingId: listID });

            Listings.update({
                _id: thisListing._id,
                listedBy: this.userId
              },{
                $set: {
                  sold: true,
                  soldInfo: {
                    soldPrice: chat.agreedPrice,
                    soldDate: new Date()
                  },
                  active: false
                }
              }, function(err){
                if(!err){

                  if ( Offers.find({ listingID: thisListing._id }).count() != 0 ){
                    Offers.find({ listingID: thisListing._id }).forEach(function(thisoffer) {
    
                        //Method is located at tapshop/server/methods/feed_server.js
                        Meteor.call('insertFeed', 'soldProduct', thisoffer.offerBy, thisListing.title, null);
    
                        //Method is located at tapshop/lib/methods/offers.js
                        Meteor.call('removeOffers', thisoffer._id, thisListing._id, thisListing.productID);
                    });
                  }
                  
                  if( follows.count() > 0 ){
                    follows.forEach( function(follow){
                      Follows.remove({ _id: follow._id });
                    });
                  }

                  Stores.update({ userId: self.userId },{ $inc: { listingsCount: -1 }} );
                  
                  if(thisListing.productID) {
                    Products.update({
                      _id: thisListing.productID
                    },{
                      $inc: {
                        listingsCount: -1,
                        productSoldCount: 1
                      }
                    });
                  }

                  Profile.update({
                    _id: profile._id
                  },{
                    $inc: { 
                      myListings: -1 
                    }
                  });

                  if( thisListing.images.length > 0 ){
                    thisListing.images.forEach( function(image){
                      Meteor.call('deleteImage', image);
                    });
                  }                  

                }
              });
    },

    //Add a view to the Listing.
    'addView': function(listId) {
      check(listId, String);
      Listings.update({
          _id: listId,
          active: true,
          sold: false
        },{
          $inc: { views: 1 }
        });
    },
    
    'followListing': function(listingId){
      check(this.userId, String);
      check(listingId, String);
      
      if(!this.userId){
        return;
      }
      
      let follow = Follows.findOne({ 
          userId: this.userId,
          listingId: listingId
       });

       if( follow ){

          Follows.remove({ _id: follow._id });
          return;
       }
       else {

        Follows.insert({
          userId: this.userId,
          listingId: listingId,
          date: new Date()
        });    

        return;
      }
  }    
});
