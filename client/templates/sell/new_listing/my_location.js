import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('NewPostMyLocationCtrl', NewPostMyLocationCtrl);

function NewPostMyLocationCtrl (
  $scope,
  $state,
  $reactive,
  $ionicLoading,
  $ionicPlatform,
  $ionicHistory,
  $ionicViewSwitcher,
  $translate,
  $rootScope,
  geolocation,
  newListing
){

  $reactive(this).attach($scope);
  const self = this;
  this.language = $translate.use() ||'en';
  this.location;
  this.publishPopup;

  this.helpers({
    profile: () => Profile.findOne({ profID: Meteor.userId() })
  });

  this.autorun( () => {
    self.location = self.getReactively('profile.location.city') || self.getReactively('profile.location.region');
  });

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
      .then( function(coords){
        clearTimeout(timeout);
        Session.set('myCoordinates', coords);

        self.call('getLocation', coords, function(err, location) {
          if (!err) {
            //Method is located at tapshop/lib/methods/profile.js
            self.call('updateLocation', location, coords, function(err){
              if(!err){

                $translate('MESSAGE.TOAST.LOCATION_UPDATED').then(function (message) {
                  if (Meteor.isCordova) {
                    $cordovaToast.showShortBottom(message);
                  }
                  else {
                    toastr.success(message);
                  }
                });

                $ionicLoading.hide();
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

                $ionicLoading.hide();
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

            $ionicLoading.hide();
          }
        });
        return;
      },
      function(error){
        clearTimeout(timeout);
        console.log(error.message);

        $translate('MESSAGE.TOAST.ENABLE_GPS').then(function (message) {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom(message);
          }
          else {
            toastr.error(message);
          }
        });

        return;
      });
  }

  this.next = function() {
    $state.go('app.new-post-description');
  }

  this.saveCallback = function(err) {
    if(err) {
      return;
    }

    $state.go('app.sell');
  }

  this.save = function(isPublished) {

    if(isPublished) {
      self.publishPopup = newListing.publishListing(self.saveCallback);
      return;
    }

    newListing.saveListing(false, self.saveCallback);
  }

  this.cancel = function() {
    newListing.init();
      
    $ionicViewSwitcher.nextDirection("back");

    $state.go('app.sell');
  }

  $scope.$on('$ionicView.beforeLeave', function (event, viewData) {
    if(self.publishPopup) {
      self.publishPopup.close();
    }
  });

  $ionicPlatform.onHardwareBackButton( function(){
    if ( $ionicHistory.backView() === null ) {
      $ionicViewSwitcher.nextDirection("back");
      $state.go('app.sell');
    }
  });

  $scope.$on('$ionicView.afterEnter', function (event, viewData) {
    if ( document.getElementById("content-main") !== null ) {
      $ionicLoading.hide();
    }
  });
};
