import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('NewPostPriceCtrl', NewPostPriceCtrl);

function NewPostPriceCtrl (
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
  this.price = newListing.getListingData('sellPrice');

  this.loadPrice = function() {
    const price = newListing.getListingData('sellPrice');

    if(!price) {
      return;
    }

    self.price = price.toString();
  }

  this.loadPrice();

  this.helpers({
    profile: () => Profile.findOne({ profID: Meteor.userId() })
  });

  this.next = function() {

    const price = self.price ? self.price.replace(/,/g, '') : undefined;
    
    if( !price || isNaN(price) === true ) {
      
      $translate('MESSAGE.TOAST.FIELD_REQUIRED').then(function (message) {

        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom(message);
        }
        else {
          toastr.error(message);
        }

      });

      return;
    }

    newListing.addField('sellPrice', parseInt(price) );
    
    $state.go('app.new-post-my-location');
  }

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
