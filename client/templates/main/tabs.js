angular
    .module('salephone')
    .directive('tabs', function (){
      return {
        restrict: 'E',
        templateUrl: 'client/templates/main/tabs.html',
        controller: function($scope, $state){

          //Highlight selected tab.
          if( $state.is('app.shop') ) {
            $scope.activeTab = 'Shop';
          }
          else if ( $state.is('app.sell') ) {
            $scope.activeTab = 'Sell';
          }
          /*
          else if ( $state.is('app.myoffers') ) {
            $scope.activeTab = 'Offers';
          }
          else if ( $state.is('app.chatlist') ) {
            $scope.activeTab = 'Chat';
          }
          */
        }
      }
    });
