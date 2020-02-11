angular
  .module('salephone')
  .factory('newListing', newListing);

function newListing ($rootScope, $cordovaCamera, $ionicPopup, $translate, $cordovaToast) {
  return {
    init: function() {
      return $rootScope.newListing = {
        productID: undefined, // required
        title: undefined, // required
        sellPrice: undefined, // required
        condition: undefined, // required
        conditionType: undefined,
        meetLocation: undefined,
        listingNotes: undefined,
        moreDetails: undefined,
        uploads: [],  // { file, preview, selected } required
        newForm: true,
        newImage: undefined
      };
    },
    newForm: function(image) {

      $rootScope.newListing.newImage = image;

      return $rootScope.newListing;
    },
    newFormLoaded: function() {
      
      $rootScope.newListing.newForm = false;
      $rootScope.newListing.newImage = undefined;
      return $rootScope.newListing;
    },
    getListingData: function(field) {
      
      if(!field) {
        return $rootScope.newListing;
      }

      return $rootScope.newListing[field];
    },
    addField: function(field, value) {
      
      $rootScope.newListing[field] = value;

      return $rootScope.newListing[field];
    },
    addUpload: function(file, preview) {
      
      $rootScope.newListing.uploads.push({ file, preview, selected: false });

      return $rootScope.newListing.uploads;
    },
    selectUpload: function(index) {
      
      const { selected } = $rootScope.newListing.uploads[index];
      
      $rootScope.newListing.uploads[index].selected = selected ? false : true;

      return $rootScope.newListing.uploads;
    },
    removeUploads: function() {

      const uploads = $rootScope.newListing.uploads.filter(upload => upload.selected === false);
      
      return $rootScope.newListing.uploads = uploads;
    },
    addImageFile: function() {
      const options = {
        quality: 70,
        destinationType: 0, // data URL
        sourceType: 0, //Photo Album
        allowEdit: false,
        encodingType: 0,// JPG
        targetWidth: 800,
        targetHeight: 800
      };

      return $cordovaCamera.getPicture(options)
    },
    publishListing : function(callback) {
      const self = this;
      
      self.saveListing(true, callback);
      /*
      return $ionicPopup.confirm({
        title: $translate.instant('LABEL.PUBLISHED_LISTING'),
        buttons: [{
          text: '<b>Publish</b>',
          type: 'button-positive',
          onTap: function(e) {
            self.saveListing(true, callback);
          }
        }]
      });
      */
    },
    saveListing: function(isPublished, callback) {
      
      const self = this;

      $rootScope.$broadcast('loadspinner');

      const listingData = $rootScope.newListing;

      const listing = {
        productID: listingData.productID || null,
        title: listingData.title,
        sellPrice: listingData.sellPrice,
        condition: listingData.condition,
        conditionType: listingData.conditionType || null,
        meetLocation: listingData.meetLocation || null,
        listingNotes: listingData.listingNotes || null,
        moreDetails: listingData.moreDetails || null,
        isPublished
      };

      return Meteor.call('postListing', listing, function(err, listingId){
      
        if(err) {
          
          $ionicLoading.hide();

          $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }
            else {
              toastr.error(message);
            }
          });

          return callback(err, undefined);
        }

        return self.uploadImages(listingId, isPublished, callback)
      });
    },
    uploadImages: function(listingId, isPublished, callback) {

      const { uploads } = $rootScope.newListing;

      let uploadCount = 0;

      let meta = {
        listID: listingId
      }

      uploads.forEach( function(image) {

        const uploadInstance = Uploads.insert({
          file: image.file,
          meta: meta,
          streams: 'dynamic',
          chunkSize: 'dynamic'
        }, false);

        uploadInstance.on('end', function(error, fileObj) {
          
          if(error) {
            return callback(error, undefined);
          }

          //Method is located at tapshop/server/methods/listings_server.js
          Meteor.call('insertImage', listingId, fileObj._id, function(err){
            if(err) {
              return callback(err, undefined);
            }

            uploadCount++;

            if (uploadCount === uploads.length) {

              if ( !isPublished ) {
                $translate('MESSAGE.TOAST.LISTING_SAVED').then(function (message) {
                  if (Meteor.isCordova) {
                    $cordovaToast.showLongBottom(message);
                  }
                  else {
                    toastr.success(message);
                  }
                });
              }

              return callback(undefined, true);
            } 

          });
          
        });

        uploadInstance.start();

      });

    }
  }
};
  