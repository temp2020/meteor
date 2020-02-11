import { _meteorAngular } from 'meteor/angular';

angular
    .module('salephone')
    .factory('convertCurrency', convertCurrency);

function convertCurrency ($window) {
    /*
    const rates = {
      'MAD': {
        price: 11.1193,  //from EUR
        base: 0.08995 //to EUR
      },
      'XAF': {
        price: 655.957, //from EUR
        base: 0.00152449 //to EUR
      },
      'XOF':{
        price: 655.957, //from EUR
        base: 0.00152449
      },
      'DZD': {
        price: 137.738, //from EUR
        base: 0.00726017 //to EUR
      },
      'TND': {
        price: 2.94325, //from EUR
        base: 0.339760 //to EUR
      }
    }
    */

    return function(price, currency, baseCurrency) {
      
        if( currency === baseCurrency ){
          if( price % 1 !== 0 ){
            return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          } 
          else{
            return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }
        }
        /*
        let missing = Meteor.settings.public.currencies.missing.split(",");

        if( missing.indexOf(baseCurrency) !== -1 ){

          price = rates[baseCurrency].price * price;

          baseCurrency = 'EUR';

        }

        if( missing.indexOf(currency) !== -1 ){

          price = rates[currency].base * price;

          currency = 'EUR';

        }

        if( currency === baseCurrency ){
          if( parseFloat( price.toFixed(2) ) % 1 !== 0 ){
            return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }
          else{
            return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          }
        }
        */

        let amount = $window.fx(price).from(currency).to(baseCurrency);

        if( parseFloat( amount.toFixed(2) ) % 1 !== 0 ){
          return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        else{
          return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    }
};
