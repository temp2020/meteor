import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base'
import { Session } from 'meteor/session';

angular
    .module('salephone')
    .controller('LoginCtrl', LoginCtrl);

 function LoginCtrl (
                      $scope,
                      $reactive,
                      $cordovaToast,
                      $rootScope,
                      $http,
                      $state,
                      $ionicLoading,
                      $translate,
                      $window,
                      moneyJs
                    ){

    $reactive(this).attach($scope);
    var self = this;

    this.login = function(){
      $rootScope.$broadcast('loadspinner');

      if( Meteor.status().connected === false ){
        $ionicLoading.hide();
        return;
      }

      if( self.user && self.password ){
        let regex = new RegExp(/.+@(.+){2,}\.(.+){2,}/);

        let loginOptions = {
          username: self.user
        }

        if ( regex.test(self.user) === true ){
          loginOptions = {
            email: self.user
          }
        }

        Meteor.loginWithPassword(loginOptions, self.password, function(err){
          if (err) {

            $translate('MESSAGE.TOAST.INVALID_EMAIL_PASS').then(function (message) {
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
            self.user = '';
            self.password = '';
            $state.go('app.shop');
            return;
          }
        });
      }
      else {
        $translate('MESSAGE.TOAST.INVALID_EMAIL_PASS').then(function (message) {
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
    }

        //Oauth login with Facebook.
    this.loginFB = function() {
      let style = self.isMobileBrowser() ? "redirect" : "popup";
      let redirect = self.isMobileBrowser() ? 'app/login' : '_oauth/facebook';

      Meteor.loginWithFacebook({
        requestPermissions: ['email', 'public_profile'],
        redirectUrl: Meteor.absoluteUrl(redirect),
        loginStyle: style
      }, function(err){
        if(err){
          if( err.error === 'Email exists.' ) {

            $translate('MESSAGE.TOAST.ACCOUNT_NOT_VERIFIED').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              }
              else {
                toastr.error(message);
              }
            });
          }
          $state.reload('app.register');
          return;
        }
        else{
          return self.register();
        }
      });
    };

    //Oauth login with Google.
        this.loginGoogle = function() {
        let style = self.isMobileBrowser() ? "redirect" : "popup";
        let redirect = self.isMobileBrowser() ? 'app/login' : '_oauth/google';

        Meteor.loginWithGoogle({
          requestPermissions: ['email', 'profile'],
          redirectUrl: Meteor.absoluteUrl(redirect),
          loginStyle: style
        }, function(err){
          if(err){
            if( err.error === 'Email exists.' ) {
              $translate('MESSAGE.TOAST.ACCOUNT_NOT_VERIFIED').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom(message);
                }
                else {
                  toastr.error(message);
                }
              });
            }
            else if(err.error === 'Account Blocked'){
              $translate('MESSAGE.TOAST.ACCOUNT_BLOCKED').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom(message);
                }
                else {
                  toastr.error(message);
                }
              });
            }
            $state.reload('app.login');
            return;
          }
          else{
            return self.register();
          }
        });
    };


    this.register = function(){
      Meteor.call('isRegistered', function(err, registered){
        if ( registered === false ) {
              //Get user location using geolocation data.
              //Method is located at tapshop/server/methods/server_methods.js
              let newProfile = {
                hasLocation: false,
                location: {
                  type: 'Point',
                  coordinates: [0,0],
                  city: null,
                  region: null,
                  country: null,
                  countryCode: null
                }
              }

              self.currentLoc = Session.get('myCoordinates');

              if ( self.currentLoc ) {
                newProfile.location.coordinates = [ self.currentLoc.lng, self.currentLoc.lat ];
                newProfile.hasLocation = true;

                Meteor.call('getLocation', self.currentLoc, function(err, loc) {
                  if ( loc ) {
                    newProfile.location.city = loc.city,
                    newProfile.location.region = loc.region,
                    newProfile.location.country = loc.country,
                    newProfile.location.countryCode = loc.countryCode

                    //Create separate user profile for public.
                    self.createProfile(newProfile);
                  }
                  else {
                    console.log( "Error getting location." );
                    self.createProfile(newProfile);
                  }
                });
              }
              else {
                self.createProfile(newProfile);
              }
        }
        else if ( registered === true ) {
          $state.go('app.shop');
        }
        else {
          Meteor.logout(function() {

            $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              }
              else {
                toastr.error(message);
              }
            });

            $state.reload('app.login');
          });
        }
      });
    }

    this.autorun( () => {
      if( Meteor.userId() ){
        return self.register();
      }
    });

    this.createProfile = function(newProfile) {
      let lang = window.localStorage.getItem('language');

      //Create separate user profile for public.
      //Method is located at tapshop/server/methods/profile_server.js
      Meteor.call('uploadProfile', newProfile, lang, function(err, profile){
        if (!err) {
          Meteor.call('sendVerifyEmail', Meteor.userId());

          $translate('MESSAGE.TOAST.ACCOUNT_REGISTERED').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showShortBottom(message);
            }
            else {
              toastr.success(message);
            }
          });

          $window.localStorage.setItem( 'currencyBase', 'EUR' );

          moneyJs.updateCurrency();

          $state.go('app.shop');
        }
        else {
          console.log("Error with your account signup. Please try again.");
            $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              }
              else {
                toastr.error(message);
              }
            });
          //Method is located at tapshop/server/methods/profile_server.js
          Meteor.call('signupError', function(err){
            Meteor.logout(function() {
              $translate('MESSAGE.TOAST.TRY_AGAIN').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showLongBottom(message);
                }
                else {
                  toastr.error(message);
                }
              });
              $state.reload('app.login');
            });
          })
        }
      });
    };

    $rootScope.$on('$cordovaInAppBrowser:exit', function(e, event){
      if ( Meteor.loggingIn() === false ) {
        $ionicLoading.hide();
      }
    });

    $scope.$on('$ionicView.afterEnter', function (e, event) {
        $ionicLoading.hide();
    });
 };
