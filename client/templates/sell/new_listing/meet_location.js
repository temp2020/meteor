import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('NewPostMeetLocationCtrl', NewPostMeetLocationCtrl);

function NewPostMeetLocationCtrl (
  $scope,
  $state,
  $reactive,
  $ionicLoading,
  $ionicPlatform,
  $ionicHistory,
  $ionicViewSwitcher,
  $translate,
  newListing
){

  $reactive(this).attach($scope);
  const self = this;
  this.language = $translate.use() ||'en';
  this.meetLocation = newListing.getListingData('meetLocation');
  this.publishPopup;

  this.saveCallback = function(err) {
    if(err) {
      return;
    }

    $state.go('app.sell');
  }

  this.save = function(isPublished) {

    if( self.meetLocation ) {

      self.meetLocation = self.meetLocation.trim().toString();

      newListing.addField('meetLocation', self.meetLocation);
    }

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
