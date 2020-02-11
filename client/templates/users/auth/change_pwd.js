import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base'

angular
    .module('salephone')
    .controller('AuthCtrl', AuthCtrl);

 function AuthCtrl ($scope, $reactive, $state, $ionicLoading, $ionicHistory, $rootScope, $cordovaToast, $translate) {
    $reactive(this).attach($scope);
    var self = this;

    //Method is located at tapshop/server/methods/profile_server.js
    Meteor.call('hasPassword', function(err, result){
      if ( err || result === false ){
        $ionicHistory.goBack();
      }
    });

    //Change password through token sent in email.
    this.changePass = function() {
        $rootScope.$broadcast('loadspinner');

        let passwordRegex = new RegExp(/^\S{6,}$/);

        if ( 
          self.oldPassword && 
          self.oldPassword !== self.password &&
          self.password && 
          passwordRegex.test(self.password) === true && 
          self.password === self.confirm 
        ) {
          Accounts.changePassword(self.oldPassword, self.password, function(err){
            if(err){
              $ionicLoading.hide();
              if ( err.error === 403 ){

                $translate('MESSAGE.TOAST.INVALID_CURRENT_PASS').then(function (message) {
                  if (Meteor.isCordova) {
                    $cordovaToast.showLongBottom(message);
                  } 
                  else {
                    toastr.error(message);
                  }
                });
                return;
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

                return;
              }
            }
            else{
              self.oldPassword = '';
              self.password = '';
              self.confirm = '';

              $translate('MESSAGE.TOAST.PASSWORD_CHANGED').then(function (message) {
                if (Meteor.isCordova) {
                  $cordovaToast.showShortBottom(message);
                } 
                else {
                  toastr.success(message);
                }
              }); 
              
              Meteor.logoutOtherClients();
              $ionicLoading.hide();
              $ionicHistory.goBack();
            }
          })
        }
        else {
          $ionicLoading.hide();
          if( !self.oldPassword ){
            
            $translate('MESSAGE.TOAST.ENTER_PASSWORD').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              } 
              else {
                toastr.error(message);
              }
            });

            return;
          }
          else if( self.oldPassword === self.password ){
            
            $translate('MESSAGE.TOAST.PASSWORD_NOT_SAME').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              } 
              else {
                toastr.error(message);
              }
            });
            
            return;
          }
          else if ( !self.password || passwordRegex.test(self.password) === false ){
            
            $translate('MESSAGE.TOAST.PASSWORD_MIN_CHAR').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              } 
              else {
                toastr.error(message);
              }
            });            
            
            return;
          }
          else if (self.password !== self.confirm){
            
            $translate('MESSAGE.TOAST.PASSWORD_NOT_MATCH').then(function (message) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom(message);
              } 
              else {
                toastr.error(message);
              }
            });

            return;
          }
          return;
        }
    }

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };
