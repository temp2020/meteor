import { Meteor } from 'meteor/meteor';

Meteor.startup(function () {
  
  if( !Meteor.settings.public.fcm.senderId ){
    return;
  }

  if(!Push) {
    return;
  }
  
  Push.Configure({
    android: {
      senderID: Meteor.settings.public.fcm.senderId,
      iconColor: '#0C431B',
      icon: 'pushicon',
      badge: true,
      sound: true,
      alert: true,
      vibrate: true,
    }
  });

  if(!PushNotification) {
    return;
  }

  PushNotification.createChannel(
    () => {
        console.log('createChannel');
    },
    () => {
        console.log('error');
    },
    {
      id: 'vastershops',
      description: 'Vastershops',
      importance: 3,
      vibration: true
    }
  );

});
