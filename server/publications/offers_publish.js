import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.publishComposite('offersRecieved', function(options) {
  check(options, {
    loaded: Number,
    skip: Number
  });

  return {
    find: function() {
      return Offers.find({
        seller: this.userId
      },{
        sort: { offerDate: -1 },
        skip: options.skip,
        limit: options.loaded
      });
    },
    children: [{
      find: function(offer) {
        return Listings.find({
          _id: offer.listingID,
          active: true,
          $or:[{ 
            expiryDate: {
              $gt: new Date()
            }
          },{
            expiryDate: null
          }]
        },{
          fields: {
            _id: true,
            title: true
          },
          limit: 1
        });
      }
    },{
      find: function(offer) {
        return Profile.find({
          profID: offer.offerBy,
        },{
          fields: {
            _id: true,
            profName: true,
            profID: true,
            profImageID: true,
            profImage: true,
            goodRating: true,
            badRating: true
          },
          limit: 1
        });
      }
    },{
      find: function(offer) {
        return ProfileImg.collection.find({ 
          'meta.userId': offer.offerBy
        }, {
          fields: {
            name: false,
            extension: false,
            path: false,
            type: false,
            size: false,
            versions: false,
            isVideo: false,
            isAudio: false,
            isImage: false,
            isText: false,
            isJSON: false,
            isPDF: false,
            _storagePath: false,
            public: false
          },
          limit: 1
        });
      }
    }]
  }

});