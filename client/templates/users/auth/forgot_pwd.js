import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

angular
    .module('salephone')
    .controller('ForgotPwdCtrl', ForgotPwdCtrl);

 function ForgotPwdCtrl ($scope, $reactive, $state, $ionicLoading, $stateParams, $rootScope, $ionicHistory, $cordovaToast, $translate) {
    $reactive(this).attach($scope);
    var self = this;

    if( $state.is('app.forgot') ){
      //Send password to email.
      this.resetPass = function() {
        let regex = new RegExp(/.+@(.+){2,}\.(.+){2,}/);

        if ( regex.test(self.email) === true ) {
          $rootScope.$broadcast('loadspinner');

          //Method is located at tapshop/server/methods/profile_server.js
          Meteor.call('resetPwd', self.email, function(err){
            if (!err){
              
              $translate('MESSAGE.TOAST.EMAIL_SENT').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showShortBottom(message);
                } 
                else {
                  toastr.success(message);
                }
              });              

              $ionicLoading.hide();
            }
            else if (err.error === 'Not Registered') {
              
              $translate('MESSAGE.TOAST.EMAIL_NOT_REGISTERED').then(function (message) {
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
        else if ( regex.test(self.email) === false ) {
          
          $translate('MESSAGE.TOAST.INVALID_EMAIL').then(function (message) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom(message);
            } 
            else {
              toastr.error(message);
            }
          });

        } else { return; }
      }
    }
    else if( $state.is('app.reset') && $stateParams.token ) {
      //Change password through token sent in email.
      this.changePass = function() {
        if( self.password.length >= 6 ) {
          $rootScope.$broadcast('loadspinner');
          if ( self.password === self.confirm ) {
            Accounts.resetPassword($stateParams.token, self.password, function(err){
              if(!err) {
          
                $translate('MESSAGE.TOAST.PASSWORD_CHANGED').then(function (message) {
                  if (Meteor.isCordova) {
                    $cordovaToast.showShortBottom(message);
                  } 
                  else {
                    toastr.success(message);
                  }
                });

                $state.go('app.shop');
              }
              else {
                if(err.error === 403) {

                  $translate('MESSAGE.TOAST.RESET_EXPIRED').then(function (message) {
                    if (Meteor.isCordova) {
                      $cordovaToast.showLongBottom(message);
                    } 
                    else {
                      toastr.error(message);
                    }
                  });

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

                }
                $ionicLoading.hide();
              }
            });
          }
          else {

            $translate('MESSAGE.TOAST.PASSWORD_NOT_MATCH').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              } 
              else {
                toastr.error(message);
              }
            });
            $ionicLoading.hide();

          }
        } else if ( self.password.length < 6 ) {

            $translate('MESSAGE.TOAST.PASSWORD_MIN_CHAR').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              } 
              else {
                toastr.error(message);
              }
            });

        }
        else { return; }
      }
    }
    else {
      $state.go('app.login')
    }

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };
