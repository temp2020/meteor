import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import _ from 'underscore';

Meteor.methods({
  //Upload new profile to database.
  'uploadProfile': function(newProfile, language) {
    check(this.userId, String);
    check(newProfile, {
      hasLocation: Boolean,
      location: {
        type: String,
        coordinates: [Number],
        city: Match.OneOf(String, null),
        region: Match.OneOf(String, null),
        country: Match.OneOf(String, null),
        countryCode: Match.OneOf(String, null)
      }
    });
    check(language, String);

    if ( Profile.find({ profID: this.userId }).count() === 0 ) {
      let defaultImg = "/images/users/profile_default.png";
      let self = this;

      let profile = _.extend(newProfile, {
        profID: this.userId,
        profName: Meteor.users.findOne({ _id: this.userId }).username,
        profImage: defaultImg,
        currency: 'EUR',
        profImageID: null,
        goodRating: 0,
        badRating: 0,
        myOffers: 0,
        myListings: 0,
        productSold: 0
      });

      return Profile.insert(profile, function(err){
        if(!err){
          Meteor.call('updateLanguage', language, function(err){
            if(!err){
              return insertUserData(self.userId);
            }
          });
        }
      });
    }
    else {
      return;
    }
  },
	
  //Send verification Email.
  'sendVerifyEmail': function(userId){
    (this.userId, String);
    (userId, String);
	  
	  if( (Meteor.settings.mailgun.username && Meteor.settings.mailgun.password) || Meteor.settings.sendgrid.apiKey ){
      let user = Meteor.users.findOne({ _id: this.userId });

          if( userId !== this.userId || !user || Meteor.user().emails[0].verified ){
            return;
          }
        
          return Accounts.sendVerificationEmail(this.userId);
    }
    else {

	  	if( Meteor.isDevelopment ){
        console.log('Automated Emails are not enabled. Please enter your API keys for emails.')
      }
      return;

    }

  },	

  //Upload changes to user profile.
  'updateProfile': function(userID, newProfile) {
    check(this.userId, String);
    check(userID, String);
    check(newProfile, {
      username: String,
      coordinates: [Number],
      hasLocation: Boolean,
      city: Match.OneOf(String, null),
      region: Match.OneOf(String, null),
      country: Match.OneOf(String, null),
      countryCode: Match.OneOf(String, null),
      currency: String
    });

    if ( userID === this.userId ) {
      let profile = Profile.findOne({ profID: this.userId });

      Profile.update({
        _id: profile._id,
        profID: this.userId
      },{
        $set: {
          currency: newProfile.currency,
          hasLocation: newProfile.hasLocation,
          'location.coordinates': newProfile.coordinates,
          'location.city': newProfile.city,
          'location.region': newProfile.region,
          'location.country': newProfile.country,
          'location.countryCode': newProfile.countryCode
        }
      });

      if( profile.currency !== newProfile.currency ){
        let listings = Listings.find({ listedBy: this.userId, active: true }).fetch();

        if( listings.length > 0 ){
          
          listings.forEach( listing => {
  
            Listings.update({
              _id: listing._id
            },{
              $set: {
                currency: newProfile.currency
              }
            });
  
          });
  
        }
      }


      if ( Listings.findOne({ listedBy: this.userId, hasLocation: false }) ){
        Listings.find({ listedBy: this.userId, hasLocation: false }).forEach( function( listing ) {
          Listings.update({
            _id: listing._id
          },{
            $set: {
              'location.coordinates': newProfile.coordinates,
              hasLocation: newProfile.hasLocation
            }
          })
        });
      }

      if ( Meteor.users.findOne({ _id: this.userId }).username != newProfile.username ) {

        Meteor.users.update({
          _id: this.userId
        },{
          $set: {
            username: newProfile.username
          }
        });
        Profile.update({
          _id: profile._id,
          profID: this.userId
        },{
          $set: {
            profName: newProfile.username
          }
        });

        if ( Listings.find({ listedBy: this.userId }).count() != 0 ) {
          Listings.find({ listedBy: this.userId }).forEach( function(thisPost) {
            Listings.update({
              _id: thisPost._id
            },{
              $set: {
                seller: newProfile.username
              }
            });
          });
        }

        if ( Offers.find({ offerBy: this.userId }).count() != 0) {
          Offers.find({ offerBy: this.userId }).forEach( function(thisOffer) {
            Offers.update({
              _id: thisOffer._id
            },{
              $set: {
                buyer: newProfile.username
              }
            });
          })
        }

        if ( ChatRoom.find({ buyer: this.userId }).count() != 0 ) {
          ChatRoom.find({ buyer: this.userId }).forEach( function(thisChat) {
            ChatRoom.update({
              _id: thisChat._id
            },{
              $set: {
                buyerName: newProfile.username
              }
            });
          });
        }

        if ( ChatRoom.find({ seller: this.userId }).count() != 0 ) {
          ChatRoom.find({ seller: this.userId }).forEach( function(thisChat) {
            ChatRoom.update({
              _id: thisChat._id
            },{
              $set: {
                sellerName: newProfile.username
              }
            });
          });
        }

        if ( Messages.find({ sentBy: this.userId }).count() != 0 ) {
          Messages.find({ sentBy: this.userId }).forEach( function(thisMsg) {
            Messages.update({
              _id: thisMsg._id
            },{
              $set: {
                user: newProfile.username
              }
            });
          });
        }

        if ( Feedback.find({ postBy: this.userId }).count() != 0 ) {
          Feedback.find({ postBy: this.userId }).forEach( function(thisFeedback) {
            Feedback.update({
              _id: thisFeedback._id
            },{
              $set: {
                postName: newProfile.username
              }
            });
          })
        }
      }
    }
  },

  //Check if user profile is registered.
  'isRegistered': function() {
    check(this.userId, String);
    if ( Profile.find({ profID: this.userId }).count() === 0 ) {
      return false;
    }
    else {
      return true;
    }
  },

  //Create new profile, if profile was not created during register.
  'signupError': function() {
    check(this.userId, String);
    if ( Profile.find({ profID: this.userId }).count() === 0 ) {
      let newProfile = {
        location: {
          type: 'Point',
          coordinates: [0,0],
          hasLocation: false,
          city: null,
          region: null,
          country: null,
          countryCode: null
        }
      };
      //Method is located at tapshop/server/methods/profile_server.js
      Meteor.call('uploadProfile', newProfile, function(err){
        if (!err) {
          return;
        }
        else {
          Meteor.users.remove({_id: this.userId});
          return;
        }
      });
    }
    else {
      return;
    }
  },

  //Send reset password email to user.
  'resetPwd': function(email) {
    check(email, String);
    let user = Accounts.findUserByEmail( email );
    if (user) {
      Accounts.sendResetPasswordEmail(user._id)
    }
    else {
      throw new Meteor.Error('Not Registered');
    }
  },


  //Check if user is registered with password.
  'hasPassword': function() {
    check(this.userId, String);
    if ( !Meteor.users.findOne({ _id: this.userId }).services.password ) {
      return false;
    }
    else {
      return true;
    }
  },

  'checkUser': function(email, username){
    check(email, String);
    check(username, String);
    let emailCheck = Accounts.findUserByEmail(email);
    let usernameCheck = Accounts.findUserByUsername(username);

    if (emailCheck) {
      throw new Meteor.Error('Email Exists');
    }
    else if (usernameCheck){
      throw new Meteor.Error('Username Exists');
    }
    else {
     return true;
    }
  },  

  //Check if username exists.
  'checkName': function(user) {
    check(user, String);
    if (
      Profile.find({ profID: { $ne: this.userId }, profName: user }).count() != 0 &&
      Meteor.users.find({ _id: { $ne: this.userId }, username: user }).count() != 0
    ) {
      return false;
    }
    else {
      return true;
    }
  },

  'updateUserPack': function(packName){
    check(this.userId, String);
    check(packName, String);

    let self = this;
    
    //let currentPack = UserPack.update({ userId: this.userId });

    let pack = Packs.findOne({ name: packName });

    if(!pack){
      throw new Meteor.Error('Pack Does Not Exist');
    }

    UserPack.update({ userId: this.userId },{
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
        listedBy: self.userId, 
        active: true,
        $or:[{ 
          expiryDate: {
            $gt: new Date()
          }
        },{
          expiryDate: null
        }] 
      }).count();

      let store = Stores.findOne({ userId: self.userId });
      
      if( store ){
        
        Stores.update({ _id: store._id },{
          $set:{
            active: pack.hasStore && store.name !== null ? true : false
          }
        });

      }

      if( listingCount > 0 ){
        
        updateListingExpiry(pack, self.userId);

      }

    });

  }
});

function insertUserData(userId){
  Stores.insert({
    userId: userId,
    name: null,
    nameText: null,
    active: false,
    listingsCount: 0,
    imageId: null,
    imageLink: '/images/utils/store.png',
    lastPost: new Date()
  });

  let pack = Packs.findOne({ name: 'PACKS.STAR' });

  UserPack.insert({
    userId: userId,
    name: pack.name,
    googleBillingId: null,
    listings: pack.listings,
    expiryDays: pack.expiryDays,
    hasStore: pack.hasStore,
    dateSelected: new Date()
  });

  UserCards.insert({
    userId: userId,
    latestListingId: null,
    cardExpiryApplied: false,
    lastUpdate: new Date(),
    level: 0,
    baseLevel: 0
  });

  Coins.insert({
    userId: userId,
    quantity: 0,
    lastUpdate: new Date()
  });

  UserSearchCards.insert({
    userId: userId,
    name: null,
    distance: null,
    expiry: null,
    lastUpdate: new Date()
  });
}