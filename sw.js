// 'use strict';
// var linkToOpen= "/" ;
// var push_message ;
// self.addEventListener('push', function(event) {

//     const pushInfoPromise = fetch('https://mallmaverickstaging.com/api/v4/twinpine/get_webpush_message')
//     .then(function(response) {
//         //console.log(response.json());
//         return response.json();
//     })
//     .then(function(response) {
//         push_message = response;
//         console.log(response.message);
//         const title = response.message.title || 'We have something to tell you';
//         var temp_icon;
//         if(response.icon_url.indexOf("missing") > -1) {
//             temp_icon = "https://mallmaverickstaging.com" + response.icon_url;
//         }
//         else {
//             temp_icon = "//codecloud.cdn.speedyrails.net/sites/5890c5296e6f640dd9000000/image/png/1485883576000/Screen Shot 2017-01-31 at 12.26.11 PM.png"
//         }
//         const options = {
//             body: response.message.body,
//             icon: temp_icon,
//             badge: response.message.badge,
//             image: "https://mallmaverickstaging.com" + response.image_url,
//             requireInteraction: true  
//         };
//         if(response.message.link!== null && response.message.link !== "") {
//             linkToOpen = response.message.link;
//         }
        
//         console.log(options.image);
//         return self.registration.showNotification(title, options);
//     });

//   event.waitUntil(pushInfoPromise);
// });

// self.addEventListener('notificationclick', function(event) {
//     var postData= {};
//     postData.data = push_message;
//     // console.log(JSON.stringify(postData));
//     var postURL = "https://mallmaverickstaging.com/api/v4/twinpine/add_webpush_click?data[push_history_id]=" + push_message.push_history_id;
//     const pushInfoPromise = fetch(postURL,
//     {
//         method: "POST",
//         body: JSON.stringify(postData)
//     })
//     .then(function(res){ 
//         //console.log(response.json());
//         return res.json(); 
        
//     })
//     .then(function(data){ 
//         console.log( JSON.stringify( data ) ) 
        
//     });
//     console.log('[Service Worker] Notification click Received.',linkToOpen);
//     event.notification.close();
    
//     event.waitUntil(
//         clients.openWindow(linkToOpen)
//     );
// });

// self.addEventListener('notificationclose', function(event) {
//     var postData= {};
//     postData.data = push_message;
//      var postURL = "https://mallmaverickstaging.com/api/v4/twinpine/add_webpush_close?data[push_history_id]=" + push_message.push_history_id;
//     const pushInfoPromise = fetch(postURL,
//     {
//         method: "POST",
//         body: JSON.stringify(postData)
//     })
//     .then(function(res){ 
//         return res.json(); 
        
//     })
//     .then(function(data){ 
//         console.log( JSON.stringify( data ) ) 
        
//     });
//     console.log('[Service Worker] Notification close Received.');
   
// });