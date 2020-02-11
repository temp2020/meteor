angular
    .module('salephone')
    .controller('NewPostConditionTypeCtrl', NewPostConditionTypeCtrl);

function NewPostConditionTypeCtrl (
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
  this.conditionType = newListing.getListingData('conditionType');

  this.select = function(type) {
    this.conditionType = type;
  }

  this.next = function() {
    
    if( self.conditionType ) {
      newListing.addField('conditionType', self.conditionType);
    }

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
