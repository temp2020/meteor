import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

Meteor.methods({

        //Send new offer to Listing. Update Offer counts.
        'newOffer': function(thisOffer, productID) {
                check( this.userId, String );
                check( productID, String );
                check(thisOffer, {
                  listingID: String,
                  offerAmount: Number,
                  currency: String
                });

                let listing = Listings.findOne({ _id: thisOffer.listingID });

                let offer = _.extend(thisOffer, {
                  offerDate: new Date(),
                  offerBy: this.userId,
                  buyer: Meteor.users.findOne({ _id: this.userId }).username,
                  read: false,
                  seller: listing.listedBy
                });

                let thisUser = Profile.findOne( { profID: this.userId } );

                Listings.update( { _id: thisOffer.listingID }, { $inc: { listOfferCount: 1 } } );
                Products.update( { _id: productID }, { $inc: { productOffersCount: 1 } } );
                Profile.update( { _id: thisUser._id }, { $inc: { myOffers: 1 } } );

                return Offers.insert(offer);
        },
        
        //Change offer amount.
        'changeOffer': function( offerID, newAmount, currency ) {
                check( this.userId, String );
                check( offerID, String );
                check( newAmount, Number );
                check( currency, String );

                Offers.update( { _id: offerID, offerBy: this.userId },
                  {$set: {
                    offerAmount: newAmount,
                    offerDate: new Date()
                }});
        },

        //Remove offer for the Listing. Update offer counts.
        'removeOffers': function( offerID, listingID, productID ) {
          check( this.userId, String );
          check( offerID, String );
          check( listingID, String );
          check( productID, String );
          let profID = Profile.findOne( { profID: this.userId } )._id;

          Listings.update( { _id: listingID }, {$inc: { listOfferCount: -1 } } );
          Profile.update( { _id: profID }, {$inc: { myOffers: -1 } } );
          Products.update( { _id: productID }, {$inc: { productOffersCount: -1 } } );
          return Offers.remove({ _id: offerID });
        },

        'readOffer': function(listingId) {
          check(this.userId, String);
          check(listingId, String);

          Offers.find({ 
            read: false, 
            seller: this.userId, 
            listingID: listingId 
          })
          .forEach(function(offer) {
                
            Offers.update({ _id: offer._id },{
              $set: {
                read: true
              }
            });

          });

          return;    
        }
});
