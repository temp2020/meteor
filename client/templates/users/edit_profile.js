import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('EditProfCtrl', EditProfCtrl);

function EditProfCtrl (
                        $scope,
                        $reactive,
                        $timeout,
                        $cordovaToast,
                        $state,
                        $http,
                        $rootScope,
                        $ionicLoading,
                        $cordovaDevice,
                        $cordovaCamera,
                        geolocation,
                        $translate,
                        $ionicModal,
                        $ionicPopup,
                        moneyJs,
                        $window
                      ) {

  $reactive(this).attach($scope);
  $scope.mylocation = null;
  var self = this;
  $scope.noName = false;

  this.mypack = '';

  this.oldCurrency = null;

  this.currencies = [];

  this.isMobile = Meteor.isCorodva;

  self.subscribe('currencies', () => [], {
    onReady: function() {
      
      self.currencies = Currencies.find({},{
        sort:{
          currency: 1
        }
      }).fetch();

      $ionicLoading.hide();
      return;
    }
  });

  this.subscribe('myPack', () => [], {
    onReady: function() {
      
      let profile = Profile.findOne({ profID: Meteor.userId() });
      let pack = UserPack.findOne({ userId: Meteor.userId() });
      
      self.oldCurrency = profile.currency;

      $translate(pack.name).then(function (name) {
        self.mypack = name;
      });
      
      $ionicLoading.hide();
      return;
    }
  });

  this.autorun( () => {
    if( Meteor.user() ){
      this.email = Meteor.user().emails[0].address
    }
  });

  //Check if user has password, or has logged-in using Oauth.
  //Method is located at tapshop/server/methods/profile_server.js
  Meteor.call('hasPassword', function(err, result){
    if ( !err && result === true ){
      $scope.hasPassword = true;
    }
    else {
      $scope.hasPassword = false;
    }
  });

  //Variables for image upload.
  this.upload = null;
  this.preview = null;
  this.imgremove = null;
  this.disabled = false;

  this.helpers({
    profile: () => Profile.findOne({ profID: Meteor.userId() }),
    profileImg: () => ProfileImg.findOne({ 'meta.userId': Meteor.userId() }),
    hasUpload() {
      if ( self.getReactively('profileImg') && !self.getReactively('imgremove') ) {
        return true;
      }
      else {
        return false;
      }
    }
  });

  $ionicModal.fromTemplateUrl('client/templates/users/currency_select.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.currencyModal = modal;
  });

  this.showCurrencies =  function(){
    if( self.currencies.length === 0 ){
      return;
    }

    $scope.currencyModal.show();
  }

  this.selectCurrency =  function(){
    $scope.currencyModal.hide();
  }

  if ( Meteor.isCordova && $cordovaDevice.getPlatform() === "Android" && $cordovaDevice.getVersion().indexOf("4.4") === 0 ) {
    self.isAndroid4 = true;

    //Save uploaded image on Android 4.4.
    this.addFile = function() {
      $rootScope.$broadcast('loadspinner');

      let options = {
        quality: 100,
        destinationType: 0, // data URL
        sourceType: 0, //Photo Album
        allowEdit: false,
        encodingType: 0,// JPG
        targetWidth: 80,
        targetHeight: 80
      };

      $cordovaCamera.getPicture(options).then(function(image){
          image = "data:image/jpeg;base64," + image;
          
          self.preview = image;

          self.upload = MeteorCameraUI.dataURIToBlob(image);
          
          $ionicLoading.hide();
          
          return;
      },
      function(err){
          
        $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
          $cordovaToast.showLongBottom(message);
        });                

        $ionicLoading.hide();
        return;
      });
    }

  }
  else {
    self.isAndroid4 = false;
  }

  //Save uploaded image.
  this.uploadImg = function(files) {
    if ( files.length != 0 ) {
      $rootScope.$broadcast('loadspinner');
      let imgUrl = window.URL.createObjectURL(files[0]);

      this.resizeImage(imgUrl, function(result){
        self.preview = result;
        self.upload = MeteorCameraUI.dataURIToBlob(result);
        $ionicLoading.hide();
      });
    }
  };


  //Remove current profile image.
  this.removeImg = function() {
    if ( this.upload != null ) {
      this.upload = null;
      this.preview = null;
      return;
    }
    else if ( self.profileImg && this.imgremove === null ) {
      this.imgremove = self.profileImg._id;
      this.preview = "/images/users/profile_default.png";
      return;
    }
  };

  //Get location data of user using Geolocaiton.
  this.getLocation = function() {
    $rootScope.$broadcast('loadspinner');
      
    let timeout = setTimeout( function(){ 
      $ionicLoading.hide();
              
      $translate('MESSAGE.TOAST.TIMEOUT').then(function (message) {
        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
        }   
        else {
          toastr.error(message);
        }
      });
    }, 15000);

    geolocation.getCurrentPosition()
      .then( function(geodata){
        clearTimeout(timeout);
        //Method is located at tapshop/server/methods/server_methods.js
        Meteor.call('getLocation', geodata, function(err, geoloc) {
          if ( !err ) {
            console.log(geoloc);
            self.profile.location.coordinates = [geodata.lng, geodata.lat];
            self.profile.hasLocation = true;
            self.profile.location.city = geoloc.city;
            self.profile.location.region = geoloc.region;
            self.profile.location.country = geoloc.country;
            self.profile.location.countryCode = geoloc.countryCode;

            if ( !geoloc.city || !geoloc.region ) {
              
              $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom(message);
                }   
                else {
                  toastr.error(message);
                }
              });

              $ionicLoading.hide();
            }
            else {
          
              $translate('MESSAGE.TOAST.LOCATION_UPDATED').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showShortBottom(message);
                }   
                else {
                  toastr.success(message);
                }
              });

              $ionicLoading.hide();
            }
          }
          else {
            console.log( "Error getting geolocation, please try again later." );
            
              $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom(message);
                }   
                else {
                  toastr.error(message);
                }
              });

            $ionicLoading.hide();
            return null;
          }
        });      
      },
      function(error){
        clearTimeout(timeout);   
        
        $translate('MESSAGE.TOAST.ENABLE_GPS').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }   
          else {
            toastr.error(message);
          }
        });

        $ionicLoading.hide();
        return;
      });
  };

  //Save profile changes in database.
  this.updateProfile = function() {
    if ( !self.profile.profName ) {
      $scope.noName = true;
      console.log("Please fill-up username.");
      
        $translate('MESSAGE.TOAST.USERNAME_REQUIRED').then(function (message) {
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
    else {
      $scope.noName = false;

      let profile = self.profile;

      if ( this.imgremove !== null ) {
        //Method is located at tapshop/lib/methods/profile.js
        Meteor.call('removeImage', this.imgremove, function(err) {
          if (err) {
            console.log('Error removing image.');
            
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
        });
      }

      //Save and upload changes to user profile.
      //Method is located at tapshop/server/methods/profile_server.js
      Meteor.call('checkName', self.profile.profName, function(err, result){
        if ( !err && result === true ) {
          let newProfile = {
              username: self.profile.profName,
              hasLocation: self.profile.hasLocation,
              coordinates: self.profile.location.coordinates,
              city: self.profile.location.city,
              region: self.profile.location.region,
              country: self.profile.location.country,
              countryCode: self.profile.location.countryCode,
              currency: self.profile.currency ? self.profile.currency : 'EUR'
          }
          //Method is located at tapshop/server/methods/profile_server.js
          Meteor.call('updateProfile', Meteor.userId(), newProfile, function(err) {
            if (!err) {
              
              if( self.oldCurrency !== newProfile.currency ){
                $window.localStorage.setItem('currencyBase', newProfile.currency);
                moneyJs.updateCurrency();
              }

              if ( self.upload !== null ) {
                let uploadFile = self.newFile(self.upload);

                if ( self.profileImg ) {
                  //Remove profile image selected for removal from database.
                  //Method is located at tapshop/lib/methods/profile.js
                  Meteor.call('removeImage', self.profileImg._id, function(err) {
                    if (!err) {
                      var uploadInstance = ProfileImg.insert({
                        file: uploadFile,
                        streams: 'dynamic',
                        chunkSize: 'dynamic'
                      }, false);

                      uploadInstance.on('end', function(error, fileObj) {
                        if (!error) {
                          //Method is located at tapshop/lib/methods/profile.js
                          Meteor.call('updateProfImg', fileObj._id, function(err){
                            if(!err){
                              
                              $translate('MESSAGE.TOAST.PROFILE_UPDATED').then(function (message) {
                                if (Meteor.isCordova) {
                                  $cordovaToast.showShortBottom(message);
                                }   
                                else {
                                  toastr.success(message);
                                }
                              });

                              $state.go('app.myprofile');
                            }
                            else {
                              console.log(err);

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
                          });
                        }
                        else {
                          console.log(err);
                          
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
                      });
                      uploadInstance.start();
                    }
                    else {
                      
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
                  });
                }
                else {
                  //Upload new image to database.
                  var uploadInstance = ProfileImg.insert({
                    file: uploadFile,
                    streams: 'dynamic',
                    chunkSize: 'dynamic'
                  }, false);

                  uploadInstance.on('end', function(error, fileObj) {
                    if (!error) {
                      //Method is located at tapshop/lib/methods/profile.js
                      Meteor.call('updateProfImg', fileObj._id, function(err){
                        if(!err){
                          
                              $translate('MESSAGE.TOAST.PROFILE_UPDATED').then(function (message) {
                                if (Meteor.isCordova) {
                                  $cordovaToast.showShortBottom(message);
                                }   
                                else {
                                  toastr.success(message);
                                }
                              });

                          $state.go('app.myprofile');
                        }
                        else {
                          console.log(err);
                          
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
                      });
                    }
                    else {
                      console.log(err);
                      
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
                  });
                  uploadInstance.start();
                }
              }
              else {
                
                $translate('MESSAGE.TOAST.PROFILE_UPDATED').then(function (message) {
                  if (Meteor.isCordova) {
                    $cordovaToast.showShortBottom(message);
                  }   
                  else {
                    toastr.success(message);
                  }
                });

                $state.go('app.myprofile');
              }
            }
            else {
              console.log("Update error, please try again.");
              
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
        }
        else if ( result === false ){
          $scope.noName = true;
          
          $translate('MESSAGE.TOAST.NEW_USERNAME').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            }   
            else {
              toastr.error(message);
            }
          });

          $ionicLoading.hide();
        }
        else {
          
              $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom(message);
                }   
                else {
                  toastr.error(message);
                }
              });

          $ionicLoading.hide();
        }
      });
    }
  };

  this.update = function(){
    
    $rootScope.$broadcast('loadspinner');

    return this.updateProfile();
  }

  //Logout the user.
  this.logout = function() {
      $rootScope.$broadcast('loadspinner');
      Meteor.logout(function(err) {
          if (!err) {
              $ionicLoading.hide();
              $state.go('app.shop');
          } else {
              $ionicLoading.hide();

              $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom(message);
                }   
                else {
                  toastr.error(message);
                }
              });

              return
          }
      });
  };

  this.resizeImage = function(url, callback){
    var sourceImage = new Image();

    sourceImage.onload = function() {
       var canvas = document.createElement("canvas");
       canvas.width = 80;
       canvas.height = 80;
       canvas.class = "edit-profileimg";
       canvas.getContext("2d").drawImage(sourceImage, 0, 0, 80, 80);
       callback(canvas.toDataURL());
    }
   sourceImage.src = url;
  }

  this.newFile = function(blob){
    let filename = self.profile.profName + '.png';
    let newFile = _.extend(blob,{
      name: filename
    })
    return newFile;
  }

  $scope.$on('$ionicView.beforeLeave', function () {
    this.upload = null;
    this.preview = null;
    this.imgremove = null;  
    $scope.currencyModal.remove();
  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }
  });
};
