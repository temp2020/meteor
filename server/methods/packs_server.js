import { Meteor } from 'meteor/meteor';

Meteor.methods({
    'getPacks': function(currency, isCordova){
        check(this.userId, String);
        check(currency, String);
        check(isCordova, Boolean);

        let userPack = UserPack.findOne({ userId: this.userId });

        let packs = Packs.find().fetch();

        packs = packs.map( pack => {

          if( pack.name === userPack.name ){
            pack.selected = true;
          }
          else{
            pack.selected = false;
          }


          
          if( isCordova && Meteor.settings.googlePlay.mode === 'live' ){
            
            pack.price = {
              currency: null,
              amount: null
            }

          }
          else {
            
            let price = pack.price.filter( price => {
              return price.currency === currency;
            });

            pack.price = {
              currency: price[0].currency,
              amount: price[0].amount
            }

          }

          return pack;

        });

        return packs;
      },

      'validatePayPal': function(paymentId, packName, userId){
        check(userId, String);
        check(packName, String);
        check(paymentId, String);

        let user = Meteor.users.findOne({ _id: userId });

        if(!user){
            throw new Meteor.Error('User Does Not Exist');
        }

        let pack = Packs.findOne({ name: packName });

        const paypal = require('paypal-rest-sdk');

        paypal.payment.get(paymentId, Meteor.bindEnvironment( (err, result) => { 
          if (!err) {
                  
            //console.log(JSON.stringify(result, undefined, 2));

            let transaction = result.transactions[0];

            if( 
                result.state === 'approved' && 
                transaction.amount.total === pack.price[0].amount.toString() && 
                transaction.amount.currency === pack.price[0].currency
            ){

              let newTransaction = {
                  userId,
                  packName,
                  paymentId,
                  type: 'paypal',
                  amount: parseFloat(transaction.amount.total),
                  currency: transaction.amount.currency,
                  date: new Date()
              }

              return createTransaction(newTransaction);

            }
            else {
              throw new Meteor.Error('Validation Error');
            }

          } 
          else {
              throw new Meteor.Error('Validation Error');
          }
        }));
      },

      'validateGooglePlay': function(receipt, signature, packName, payment){
        
        if(!this.userId){
          throw new Meteor.Error('Not Authorized');
        }

        if(!receipt || !signature){
          throw new Meteor.Error('No Purchase Data');
        }
        
        const iap = require('in-app-purchase');

        let userId = this.userId;
        
        let data = { receipt, signature };

        iap.setup(Meteor.bindEnvironment( (err) => {
          if (err) {
            console.log( JSON.stringify(err, undefined, 2) );
            throw new Meteor.Error(err);
          }
          
          iap.validate(iap.GOOGLE, data, Meteor.bindEnvironment((err, res) => {
              
            if (err) {
              console.log( JSON.stringify(err, undefined, 2) );
              throw new Meteor.Error(err);
            } 
            if ( iap.isValidated(res) ) {
              
              let purchaseData = iap.getPurchaseData(res);
              
              let selectedPack = Packs.findOne({ googlePlayId: purchaseData[0].productId });

              if(!selectedPack){
                throw new Meteor.Error('Product Not Available');
              }

              let newTransaction = {
                userId,
                packName: selectedPack.name,
                type: 'googlePlay',
                amount: payment && payment.amount ? parseFloat(payment.amount) : 'Please check Google Play Console.',
                currency: payment && payment.currency ? payment.currency : 'Please check Google Play Console.',
                date: new Date(),
                details: purchaseData[0]
              }

              return createTransaction(newTransaction);
            }
            else {
              throw new Meteor.Error('Order Not Valid');
            }
          }));

        }));

      },

      'valdiateFree': function(packName){
        check(this.userId, String);
        check(packName, String);

        let selectedPack = Packs.findOne({ name: packName });

        if( !selectedPack || !selectedPack.isFree ){
          throw new Meteor.Error('Selected Pack is Not Free.');
        }

        return updateUserPack(packName, this.userId);

      }
});

function createTransaction(details){
    return Transactions.insert(details, function(err){
        if(!err){
            return updateUserPack(details.packName, details.userId);
        }
    });
}

function updateUserPack(packName, userId){

    let pack = Packs.findOne({ name: packName });

    if(!pack){
      throw new Meteor.Error('Pack Does Not Exist');
    }

    UserPack.update({ userId: userId },{
      $set:{
        name: pack.name,
        listings: pack.listings,
        expiryDays: pack.expiryDays,
        hasStore: pack.hasStore,
        dateSelected: new Date()
      }
    }, function(err){

      if(err){
        return;
      }
      
      let listingCount = Listings.find({ 
        listedBy: userId, 
        active: true,
        $or:[{ 
          expiryDate: {
            $gt: new Date()
          }
        },{
          expiryDate: null
        }] 
      }).count();

      let store = Stores.findOne({ userId: userId });

      if( store ){
        
        Stores.update({ _id: store._id },{
          $set:{
            active: pack.hasStore && store.name !== null ? true : false
          }
        });

      }

      if( listingCount > 0 ){
        
        updateListingExpiry(pack, userId);

      }

    });
}


function updateListingExpiry(pack, userId){

    Listings.find({ 
      listedBy: userId, 
      active: true,
      isPublished: true 
    }).forEach( function(listing){
  
      let newExpiry = listing.lastPublishDate.getTime() + (3600000 * 24 * pack.expiryDays);

      newExpiry -= listing.totalPublishedTime;
  
      Listings.update({ _id: listing._id },{
        $set:{
          expiryDate: pack.expiryDays !== 0 ? new Date(newExpiry) : null
        }
      });
  
    });
  
    return updateListingCount(pack, userId);
  
  }
  
  function updateListingCount(pack, userId){
  
    let listingCount = Listings.find({ 
      listedBy: userId, 
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
  
    if( listingCount > pack.listings ){
  
      Listings.find({ 
        listedBy: userId, 
        active: true,
        isPublished: true,
        $or:[{ 
          expiryDate: {
            $gt: new Date()
          }
        },{
          expiryDate: null
        }] 
      },{
        limit: listingCount - pack.listings,
        sort:{
          postDate: 1
        }
      })
      .forEach( function(listing){
        
        removeListing(listing);
  
      });
  
    }
  
  }
  
  function removeListing(listing){
  
    Listings.update({ _id: listing._id }, {
      $set:{
        active: false,
        expiryDate: null,
        isPublished: false
      }
    }, function(){
  
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
  
    });
  }