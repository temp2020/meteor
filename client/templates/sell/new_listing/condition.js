import { Meteor } from 'meteor/meteor';

angular
    .module('salephone')
    .controller('NewPostConditionCtrl', NewPostConditionCtrl);

function NewPostConditionCtrl (
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
  this.condition = newListing.getListingData('condition');

  this.select = function(condition) {
    this.condition = condition
  }

  this.next = function() {
    
    if( !self.condition ) {
      
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

    newListing.addField('condition', self.condition);

    // $state.go('app.new-post-condition-type');
    $state.go('app.new-post-price');
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
