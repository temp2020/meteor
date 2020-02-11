import { newListing } from '../components/new_listing_data';

angular
  .module('salephone')
  .controller('NewPostImagesCtrl', NewPostImagesCtrl);

function NewPostImagesCtrl (
  $state,
  $scope,
  $reactive,
  newListing,
  $ionicHistory,
  $ionicViewSwitcher,
  $ionicModal
) {
  $reactive(this).attach($scope);
  this.language = window.localStorage.getItem('language') || 'en';
  const self = this;
  this.isApp = Meteor.isCordova;
  this.listing = newListing.getListingData();
  this.imageSelected = false;
  $scope.newImg = '';
  $scope.croppedImg = '';

  this.isNewForm = function() {
    return this.listing && 
      this.listing.newForm && 
      this.listing.newImage;
  }
  
  this.onFileSelect = function(files) {

    if (self.listing.uploads.length >= 4) {

      $translate('MESSAGE.TOAST.TOO_MANY').then(function (message) {
        if (Meteor.isCordova) {
          $cordovaToast.showShortBottom(message);
        } else {
          toastr.error(message);
        }
      });

      return;
    }

    if (files[0]) {

      const image = window.URL.createObjectURL(files[0]);

      self.loadEditor(image);
    }
  }

  this.addFile = function() {
    
    if (self.listing.uploads.length >= 4) {

      $translate('MESSAGE.TOAST.TOO_MANY').then(function (message) {
        $cordovaToast.showShortBottom(message);
      });

      return;
    }

    newListing.addImageFile()
      .then(function(image) {

        if(!image) {
          return;
        }
        
        image = "data:image/jpeg;base64," + image;

        self.loadEditor(image);

      },
      function(){
        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          $cordovaToast.showLongBottom(message);
        });
      });
  }


  this.loadEditor = function(image){
    $scope.newImg = image;

    $scope.imgCrop.show();

    angular.element(document.querySelector('#newUpload')).on('load', function() {        
      $('#newUpload').cropper({
        aspectRatio: 1/1,
        viewMode: 1,
        zoomOnTouch: false,
        zoomOnWheel: true,            
        dragMode: 'move',
        rotatable: true,
        movable: true,
        responsive: false,
        toggleDragModeOnDblclick: false,
        minContainerHeight: 500,
        minCropBoxWidth: 50,
        minCropBoxHeight: 50,
        built: function(e) {
          $scope.croppedImg = $(this).cropper('getCroppedCanvas', { width: 500, height: 500 }).toDataURL("image/jpeg", 1.0);
        },
        cropend: function(e) {
          $scope.croppedImg = $(this).cropper('getCroppedCanvas', { width: 500, height: 500 }).toDataURL("image/jpeg", 1.0);
        }
      })
    });
  } 

  //Rotate Image
  $scope.rotate = function() {
    $('#newUpload').cropper('rotate', 90);
    $scope.croppedImg = $('#newUpload').cropper('getCroppedCanvas', { width: 500, height: 500 }).toDataURL("image/jpeg", 1.0);
  }
  
  //Zoom Image
  $scope.zoomIn = function() {
    $('#newUpload').cropper('zoom', 0.1);
    $scope.croppedImg = $('#newUpload').cropper('getCroppedCanvas', { width: 500, height: 500 }).toDataURL("image/jpeg", 1.0);
  }
  
  $scope.zoomOut = function() {
    $('#newUpload').cropper('zoom', -0.1);
    $scope.croppedImg = $('#newUpload').cropper('getCroppedCanvas', { width: 500, height: 500 }).toDataURL("image/jpeg", 1.0);
  }
  
  //Save cropped image to array.
  $scope.uploadImg = function() {
    setTimeout(function(){
      $scope.croppedImg = $('#newUpload').cropper('getCroppedCanvas', { width: 500, height: 500 }).toDataURL("image/jpeg", 1.0);

      if ($scope.croppedImg) {
        
        const preview = $scope.croppedImg;

        const blob = MeteorCameraUI.dataURIToBlob($scope.croppedImg);

        const file = self.newFile(blob, `listing-image-${ Date.now() }`);

        self.listing.uploads = newListing.addUpload(file, preview);
  
        $scope.newImg = '';
        $scope.croppedImg = '';
        $scope.imgCrop.hide();
        $('#newUpload').cropper('destroy');

        if ( self.isNewForm() ) {
          self.listing = newListing.newFormLoaded();
        }

      } else {
  
        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }
          else {
            toastr.error(message);
          }
        });

      }
    },300);

  };

  this.selectImage = function(index) {
    self.listing.uploads = newListing.selectUpload(index);

    const selected = self.listing.uploads.filter(image => image.selected)

    if( selected.length > 0 ) {
      
      self.imageSelected = true;

    } else {

      self.imageSelected = false;
    }
  }

  this.removeUploads = function() {
    self.listing.uploads = newListing.removeUploads();

    self.imageSelected = false;
  }

  this.newFile = function(blob, name){
    let filename = '';
    if (blob.type === "image/jpeg") {
      filename = name + '.jpg';
    } else if (blob.type === "image/png") {
      filename = name + '.png';
    } else if (blob.type === "image/gif") {
      filename = name + '.gif';
    } else {
      throw error;
    }
    let newFile = _.extend(blob,{
      name: filename
    })
    return newFile;
  }
  
  //Cancel image upload.
  $scope.cancelImg = function() {
    $scope.imgCrop.hide();
    $scope.newImg = '';
    $scope.croppedImg = '';
    $('#newUpload').cropper('destroy');

    if ( self.isNewForm() ) {

      newListing.init();
      
      if ( $ionicHistory.backView() === null ) {
        $ionicViewSwitcher.nextDirection("back");
        $state.go('app.sell');
        return;
      }

      $ionicHistory.goBack();
    }
  };

  this.initForm = function() {
    if ( !self.isNewForm() ) {
      return;
    }
    return self.loadEditor( self.listing.newImage );
  }

  this.next = function() {
    if(self.listing.uploads === 0) {

      $translate('MESSAGE.TOAST.FIELD_REQUIRED').then(function (message) {

        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
        }
        else {
          toastr.error(message);
        }

      });

      return
    };
    $state.go('app.new-post-category');
  }

  $ionicModal.fromTemplateUrl('client/templates/sell/components/img_crop.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    
    $scope.imgCrop = modal;

    self.initForm();
  });

  $scope.$on('$ionicView.beforeLeave', function (event, viewData) {
    $scope.imgCrop.remove();
    $('#newUpload').cropper('destroy');    
  });
}