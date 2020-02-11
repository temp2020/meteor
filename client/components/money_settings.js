import { _meteorAngular } from 'meteor/angular';

angular
    .module('salephone')
    .factory('moneyJs', moneyJs);

function moneyJs ($http, $window) {
    
    let updateCurrency = function() {
        let base, rates;
        let missing = Meteor.settings.public.currencies.missing.split(",");
        base = $window.localStorage.getItem('currencyBase');
        rates = $window.localStorage.getItem('currencyRates');

        $window.fx.base = base || 'EUR';

        if( base && missing.indexOf(base) !== -1 ){
          $window.fx.base = 'EUR';
        } 
        
        if(rates && rates[0] === '{') {
          $window.fx.rates = JSON.parse(rates)
        }

        Meteor.call('getCurrencies', $window.fx.base, function(err, result) {
            if(err){
              console.log( 'Error updating exchange rates.' );
              console.log( err );
              return;
            }
            
            $window.fx.rates = result.rates;
            $window.localStorage.setItem('currencyRates', JSON.stringify(result.rates) ); 
        });
    }

    return {
        updateCurrency: updateCurrency
    }
};
