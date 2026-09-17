-- Production setup supplied by the owner. Prices remain editable in Owner settings.
UPDATE settings SET data=json_set(data,
 '$.brand','Gramin Services',
 '$.base','Narsipatnam', '$.pin','531113', '$.supportPhone','9603139462', '$.hours','9am–6pm', '$.ready',1,
 '$.areas',json_array('Narsipatnam','Amalapuram','Balighattam','Chettupalle','Dharmasagaram','Duggada','Gabbada','Guramdorapalem','Neelampeta','Laxmipuram','Peda Boddepalle','Veerabhupala Patnam','Vemulapudi','Yerakannapalem'),
 '$.terms','Bookings are confirmed after coverage review. A visit fee and travel fee apply when a technician attends. The technician shares an estimate before repair work; customers approve or decline it in the app. Cancel before dispatch when possible. Repairs include the agreed workmanship warranty shown on the estimate. Payments may be cash or test checkout in this sample. Customers can leave feedback after completion.',
 '$.privacy','We use your name, phone, village, booking details and service history to deliver support, protect accounts and resolve disputes. Keep your sign-in secure. We retain service records only as needed for operations and legal obligations.')
 WHERE id='business';
