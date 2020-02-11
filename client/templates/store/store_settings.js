angular
    .module('salephone')
    .controller('StoreSettingsCtrl', StoreSettingsCtrl);

function StoreSettingsCtrl (
  $scope,
  $reactive,
  $cordovaToast,
  $rootScope,
  $ionicLoading,
  $cordovaCamera,
  $translate,
  $ionicModal,
  $ionicPopup
) {

  $reactive(this).attach($scope);
  const self = this;

  this.hasStore = true;  
  this.storePreview = null;
  this.storeFile = null;

  this.subscribe('myPack', () => [], {
    onReady: function() {
      
      let pack = UserPack.findOne({ userId: Meteor.userId() });

      self.hasStore = pack.hasStore;

      $ionicLoading.hide();

      return;
    }
  });

  this.helpers({
    store: () => Stores.findOne({ userId: Meteor.userId() })
  });

  this.autorun( () => {
    if( self.getCollectionReactively('store') ) {
      self.store.description = self.store.description ? 
        self.store.description.replace(/<br\s*[\/]?>/g, "\n") :
        null

      return;
    }
  });

  this.addStoreFile = function(){

    let options = {
      quality: 70,
      destinationType: 0, // data URL
      sourceType: 0, //Photo Album
      allowEdit: false,
      encodingType: 0,// JPG
      targetWidth: 600,
      targetHeight: 600
    };
    
    $cordovaCamera.getPicture(options).then(function(image){
      
      image = "data:image/jpeg;base64," + image;
        
      $scope.newImg = image;
      
      return self.loadEditor();
      
    },
    function(err){
        
      $scope.newImg = '';

      return;
    });
  }
    
  this.loadStoreImage = function(files) {
    if (files[0]) {
      //Load image cropper.
      $scope.newImg = window.URL.createObjectURL(files[0]);
      return self.loadEditor();
    }
    else {
      $scope.newImg = '';
    }
  };
    
  this.loadEditor = function(){
    
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
          $scope.croppedImg = $(this).cropper('getCroppedCanvas', { width: 200, height: 200 }).toDataURL("image/jpeg", 1.0);
        },
        cropend: function(e) {
          $scope.croppedImg = $(this).cropper('getCroppedCanvas', { width: 200, height: 200 }).toDataURL("image/jpeg", 1.0);
        }
      })
    });
  }

  //Rotate Image
  $scope.rotate = function() {
    $('#newUpload').cropper('rotate', 90);
    $scope.croppedImg = $('#newUpload').cropper('getCroppedCanvas', { width: 200, height: 200 }).toDataURL("image/jpeg", 1.0);
  }
    
  //Zoom Image
  $scope.zoomIn = function() {
    $('#newUpload').cropper('zoom', 0.1);
    $scope.croppedImg = $('#newUpload').cropper('getCroppedCanvas', { width: 200, height: 200 }).toDataURL("image/jpeg", 1.0);
  }
    
  $scope.zoomOut = function() {
    $('#newUpload').cropper('zoom', -0.1);
    $scope.croppedImg = $('#newUpload').cropper('getCroppedCanvas', { width: 200, height: 200 }).toDataURL("image/jpeg", 1.0);
  }
    
  //Save cropped image to array.
  $scope.uploadImg = function() {
    setTimeout(function(){
      $scope.croppedImg = $('#newUpload').cropper('getCroppedCanvas', { width: 200, height: 200 }).toDataURL("image/jpeg", 1.0);
      
      if ($scope.croppedImg) {
        
        let saveUpload = MeteorCameraUI.dataURIToBlob($scope.croppedImg);
  
        self.storePreview = $scope.croppedImg;
        self.storeFile = saveUpload;
  
        $scope.newImg = '';
        $scope.croppedImg = '';
        $scope.imgCrop.hide();
        $('#newUpload').cropper('destroy');

      } else {
  
        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }
          else {
            toastr.error(message);
          }
        });
  
        $scope.newImg = '';
        $scope.croppedImg = '';
        $scope.imgCrop.hide();
        $('#newUpload').cropper('destroy');
      }
    }, 100);  

  };
    
  //Cancel image upload.
  $scope.cancelImg = function() {
    $scope.imgCrop.hide();
    $scope.newImg = '';
    $scope.croppedImg = '';
    $('#newUpload').cropper('destroy');
  };

  this.updateSuccess = function() {

    $translate('MESSAGE.TOAST.STORE_UPDATED').then(function (message) {
      if (Meteor.isCordova) {
        $cordovaToast.showLongBottom(message);
      }   
      else {
        toastr.success(message);
      }
    });

    $ionicLoading.hide();
    return;
  }

  this.updateStoreName = function(){

    const storeData = {
      name: self.store.name,
      description: self.store.description ? 
        self.store.description.toString().replace(/(?:\r\n|\r|\n)/g, '<br />') : 
        null
    }

    self.call('updateStoreName', self.store._id, storeData, function(err, res){

      if (!err) {
        
        return self.updateSuccess();

      } else {
        
        $ionicLoading.hide(); 

        if( err.error === 'Name Forbidden' ){

          $translate('MESSAGE.TOAST.STORENAME_FORBIDDEN').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }   
            else {
              toastr.error(message);
            }
          });

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

        return;
      }
    });
  }
    
  this.newStoreFile = function(blob, name){
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
    
  this.updateStoreImage = function(){
        
    let filename = self.store.name ? self.store.name : self.store._id;
    
    let fileData = self.newStoreFile( self.storeFile, filename );
    
    StoreImage.insert({
      file: fileData,
      meta: {
        storeId: self.store._id,
        userId: Meteor.userId()
      },
      streams: 'dynamic',
      chunkSize: 'dynamic',
      onUploaded: function (error, fileObj) {
            
        self.call('updateStoreImage', self.store._id, fileObj._id, function(err){
          if(!err){
            
            self.storePreview = null;
            self.storeFile = null;

            if( self.store.name ){
              
              return self.updateStoreName();

            }
            else{

              return self.updateSuccess();

            }
          }
          else{
            $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              }   
              else {
                toastr.error(message);
              }
            });
    
            $ionicLoading.hide();
    
            return;
          }
        })

        //if( self.this.store.name)
      },
      onError: function(error, fileRef) {
        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }   
          else {
            toastr.error(message);
          }
        });  
        $ionicLoading.hide();  
        return;
      }
    }, true );
  }

  this.update = function(){

    if (!self.store.name) {
      $translate('MESSAGE.TOAST.ENTER_STORE_NAME').then(function (message) {
        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
        }   
        else {
          toastr.error(message);
        }
      });

      return;
    }
    
    $rootScope.$broadcast('loadspinner');
    
    if( this.storeFile ){

      return this.updateStoreImage();

    }
    else if( this.store.name && !this.storeFile ){
      
      return this.updateStoreName();

    }

    return;
  }

  this.newFile = function(blob){
    let filename = self.profile.profName + '.png';
    let newFile = _.extend(blob,{
      name: filename
    })
    return newFile;
  }

  this.removeStore = function(){
    $translate([
      'LABEL.CONFIRM_REMOVE_STORE',
      'LAYOUT.STYLE',
      'LABEL.REMOVE_STORE_CONFIRM',
      'LABEL.NO',
      'LABEL.YES',
      'MESSAGE.TOAST.STORE_REMOVED',
      'MESSAGE.TOAST.TRY_AGAIN'
    ])
    .then(function (result) {
    
      self.removePopup = $ionicPopup.confirm({
        title: result['LABEL.CONFIRM_REMOVE_STORE'],
        cssClass: result['LAYOUT.STYLE'],
        template: result['LABEL.REMOVE_STORE_CONFIRM'],
        scope: $scope,
        buttons: [{
          text: result['LABEL.NO']
        },{
          text: '<b>' + result['LABEL.YES'] + '</b>',
          type: 'button-assertive',
          onTap: function() {
            $rootScope.$broadcast('loadspinner');
  
            self.call('removeStore', self.store._id, function(err){
              $ionicLoading.hide();
  
              if(!err){

                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom( result['MESSAGE.TOAST.STORE_REMOVED'] );
                }   
                else {
                  toastr.error( result['MESSAGE.TOAST.STORE_REMOVED'] );
                }

                return;
              }

              else{

                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom( result['MESSAGE.TOAST.TRY_AGAIN'] );
                }   
                else {
                  toastr.error( result['MESSAGE.TOAST.TRY_AGAIN'] );
                }

                return;
              }
            });
  
          }
        }]
      });
    });
  }


  //Image cropper canvas.
  $ionicModal.fromTemplateUrl('client/templates/sell/components/img_crop.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.imgCrop = modal;
  });
  
  $scope.$on('$ionicView.beforeLeave', function () {
    this.storePreview = null;
    this.storeFile = null;
    $('#newUpload').cropper('destroy');
    $scope.imgCrop.remove();
    if(self.removePopup){
      self.removePopup.close();
    }
  });

  $scope.$on('$ionicView.afterEnter', function () {
    $ionicLoading.hide();
  });

 };