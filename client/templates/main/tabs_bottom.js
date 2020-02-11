import { _meteorAngular } from 'meteor/angular';

angular
    .module('salephone')
    .directive('tabsBottom', function (){
      return {
        restrict: 'E',
        templateUrl: 'client/templates/main/tabs_bottom.html',
        controller: function($scope, $state, $ionicViewSwitcher){

          //Highlight selected tab.

          if( $state.is('app.stores') ) {
            $scope.activeBottom = 0;
          }
          else if ( $state.is('app.favorites') ) {
            $scope.activeBottom = 1;
          }
          else if ( $state.is('app.search') ) {
            $scope.activeBottom = 2;
          }
          else if ( $state.is('app.followed') ) {
            $scope.activeBottom = 3;
          }
          else if ( $state.is('app.myprofile') || $state.is('app.login') ) {
            $scope.activeBottom = 4;
          }
          /*
          else if( $state.is('app.feeds') ){
            $scope.activeBottom = 4;
          }
          */

          $scope.goTo = function(page){

            if( page === 0 && !$state.is('app.stores') ){
              $ionicViewSwitcher.nextDirection("enter");
              $state.go('app.stores');
              return;
            }
            else if( page === 1 && !$state.is('app.favorites') ){
              $ionicViewSwitcher.nextDirection("enter");
              $state.go('app.favorites');
              return;
            }
            else if( page === 2 && !$state.is('app.search') ){
              $ionicViewSwitcher.nextDirection("enter");
              $state.go('app.search');
              return;
            }
            else if( page === 3 && !$state.is('app.followed') ){
              $ionicViewSwitcher.nextDirection("enter");
              $state.go('app.followed');
              return;
            }
            else if( page === 4 && !$state.is('app.myprofile') ){
              $ionicViewSwitcher.nextDirection("enter");

              if (Meteor.userId()) {
                $state.go('app.myprofile');
              } else { 
                $state.go('app.login')
              }
              return;
            }
            /*
            else if( page === 4 && !$state.is('app.feeds') ){
              $ionicViewSwitcher.nextDirection("enter");
              $state.go('app.feeds');
              return;
            }
            */
          }

        }
      }
    });
