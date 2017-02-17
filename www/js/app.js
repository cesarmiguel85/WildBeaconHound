var verbose = false;

var db = null;

var list_ppe = [];
var list_mac = [];

var waitVariable=false;
var listPpeAlreadyLoaded=false;

var sensitivity = window.localStorage.getItem("sensitivity");


function onAppReady() {
    if( navigator.splashscreen && navigator.splashscreen.hide ) {   // Cordova API detected
        navigator.splashscreen.hide() ;
    }


};

document.addEventListener("app.Ready", onAppReady, false) ;

document.addEventListener('deviceready', function() {

    db = window.sqlitePlugin.openDatabase({name: 'beaconHound.db', location: 'default'});


    //CHECK PPE TABLE

    db.transaction(function(tx) {

        //check if table exists
        tx.executeSql("SELECT COUNT(*) AS numero FROM sqlite_master WHERE type = 'table' AND name = 'ppe';", [], function(tx, res){

            if (verbose) alert(res.rows.item(0).numero);

            if (res.rows.item(0).numero==0) {

                //create table
                tx.executeSql('CREATE TABLE IF NOT EXISTS `ppe` ( `ppe_id` integer primary key autoincrement, `ppe_name` text, `ppe_desc` text, `ppe_active` integer NOT NULL DEFAULT "0");', [], function(tx,res){

                    if (verbose) alert("Table ppe created");

                    //insert data
                    tx.executeSql("INSERT INTO `ppe` (`ppe_id`, `ppe_name`, `ppe_desc`, `ppe_active`) VALUES (1, 'Helmet', 'A security helmet.', 1), (2, 'Shoes', 'Security metal shoes.', 1), (3, 'Glasses', 'Plastic glasses to protect the eyes.', 0), (4, 'Gloves', 'Heat resistant gloves.', 1), (5, 'Reflecting vest', 'Vest to protect your clothing.', 1), (6, 'Gas detector', 'Detect toxic gases.', 0);", [], function(tx, res){

                        alert("Table ppe did not exist, it was created and data was inserted.");

                    })

                });


            }
            else {
                      if (verbose) alert("Table ppe already exists");
            }


            //retrieve data of ppe_items from db
            db.transaction(function(transaction) {
                transaction.executeSql("SELECT * FROM ppe WHERE 1", [], function(tx, res){
                    for(var iii = 0; iii < res.rows.length; iii++)
                    {
                        list_ppe.push(res.rows.item(iii));

                    }

                    listPpeAlreadyLoaded=true;

                    if (verbose) alert(JSON.stringify(list_ppe));

                })
            });




        });

    }, function(err){

        //errors for all transactions are reported here
        alert("Error: " + err.message)

    });





    //CHECK MAC TABLE

    db.transaction(function(tx) {

        //check if table exists
        tx.executeSql("SELECT COUNT(*) AS numero FROM sqlite_master WHERE type = 'table' AND name = 'mac';", [], function(tx, res){

            if (verbose) alert(res.rows.item(0).numero);

            if (res.rows.item(0).numero==0) {

                //create table
                tx.executeSql('CREATE TABLE IF NOT EXISTS `mac` ( `mac_address` varchar(17) primary key, `ppe_name` text, `mac_ppe_id` integer DEFAULT "0");', [], function(tx,res){

                    if (verbose) alert("Table mac created");

                });


            }
            else {
                      if (verbose) alert("Table mac already exists");
            }


            //retrieve data of ppe_items from db
            db.transaction(function(transaction) {
                transaction.executeSql("SELECT * FROM mac WHERE 1", [], function(tx, res){
                    for(var iii = 0; iii < res.rows.length; iii++)
                    {
                        list_mac.push(res.rows.item(iii));

                    }

                    if (verbose) alert(JSON.stringify(list_mac));

                })
            });





        });

    }, function(err){

        //errors for all transactions are reported here
        alert("Error: " + err.message)

    });


    $(".toggle_switch").bootstrapSwitch({size: 'small'});


    $('body').on('switchChange.bootstrapSwitch',".toggle_switch",function() {


        var ppe_active = 0;
        var ppe_id = $(this).attr("name");

        if (verbose) alert("Updating: PPE "+ppe_id+" active state modified to "+ppe_active);

        if($(this).is(':checked')) {
            ppe_active = 1;
        }


        //retrieve data of ppe_items from db
        db.transaction(function(transaction) {
            transaction.executeSql('UPDATE ppe SET ppe_active="'+ppe_active+'" WHERE ppe_id="'+ppe_id+'"', [], function(tx, res){
                if (verbose) alert('DONE: UPDATE ppe SET ppe_active="'+ppe_active+'" WHERE ppe_id="'+ppe_id+'"');

                //Update list in controller (IS IT NEEDED?)
                angular.element('#switchController').scope().switch.refresh_ppe_items();
                angular.element('#switchController').scope().$apply();
            });
        });





    });



    $('body').on('change',".setPpeType",function() {


        var mac_adress = $(this).attr("mac");
        var ppe_id = $(this).val();

        if (verbose) alert("Updating: MAC "+mac_adress+" to type "+ppe_id);


        //retrieve data of ppe_items from db
        db.transaction(function(transaction) {
            transaction.executeSql('INSERT OR REPLACE INTO mac (mac_address,mac_ppe_id) VALUES ("'+mac_adress+'","'+ppe_id+'")', [], function(tx, res){
                if (verbose) alert('DONE: INSERT OR REPLACE INTO mac (mac_address,mac_ppe_id) VALUES ("'+mac_adress+'","'+ppe_id+'")');

                //Update list in controller (IS IT NEEDED?)
                angular.element('#switchController').scope().switch.refresh_mac();
                angular.element('#switchController').scope().$apply();

            });
        });


        this.refresh_mac();

        $scope.$apply();


    });


    if (sensitivity === undefined || sensitivity === null) {
        sensitivity = -70;
        $("#sensitivity").val("-70");
    }
    else {

        $("#sensitivity").val(sensitivity);
    }


    $('body').on('change',"#sensitivity",function() {

        if (verbose) alert("sensitivity changed");

        sensitivity = $("#sensitivity").val();
        window.localStorage.setItem("sensitivity", sensitivity);

    });

    ble.enable(
        function() {
            //console.log("Bluetooth is enabled");
        },
        function() {
            alert("I cannot work without bluetooth... that is quite obvious, dummy!");
        }
    );





});





    var app = angular.module('pageSwitch',['ngAnimate']);

    app.controller('switchController', function($timeout,$scope) {

        this.page = 1;

        this.foundBeacons = [];

        this.ppe_items = list_ppe;


        this.gotoPage = function(myPage) {
            //alert("changing to page "+myPage);
            this.page = myPage;
            //alert(this.page);


        };


        this.refresh_ppe_items = function() {

            list_ppe = [];
            if (verbose) alert("ppe_items refreshing");


             //retrieve data of ppe_items from db
            db.transaction(function(transaction) {
                transaction.executeSql("SELECT * FROM ppe WHERE 1", [], function(tx, res){
                    for(var iii = 0; iii < res.rows.length; iii++)
                    {
                        list_ppe.push(res.rows.item(iii));

                    }

                    this.ppe_items = list_ppe;
                    $scope.$apply();
                    if (verbose) alert("ppe_items refreshed");

                    $(".toggle_switch").bootstrapSwitch({size: 'small'});

                    if (verbose) alert(JSON.stringify(list_ppe));

                })
            });



        };

        this.refresh_mac = function() {

            list_ppe = [];
            if (verbose) alert("list_mac refreshing");

            list_mac =[];

            //retrieve data of ppe_items from db
            db.transaction(function(transaction) {
                transaction.executeSql("SELECT * FROM mac WHERE 1", [], function(tx, res){
                    for(var iii = 0; iii < res.rows.length; iii++)
                    {
                        list_mac.push(res.rows.item(iii));

                    }

                    if (verbose) alert(JSON.stringify(list_mac));

                })
            });


        };


        this.scanNearby = function() {

            var _this = this;

            this.foundBeacons = [];

            var tempArray = [];


            $("#scanResults").hide();
            $("#scanningWaiting").show();
            $("#funnyLoading").html(FunnyLoading());

            this.test = 1;

            ble.scan([], 7, function(device) {

                //Add device to array
                tempArray.push(device);

            },function(error) {
                alert("something went wrong! "+error);
            });



            $timeout(function() {

                for(var iii = 0; iii < tempArray.length; iii++) {

                    for(var ii = 0; ii < list_mac.length; ii++) {

                        if (tempArray[iii].id == list_mac[ii].mac_address) {

                            tempArray[iii].type_ppe = list_mac[ii].mac_ppe_id;

                            if (verbose) alert("Found match mac "+list_mac[ii].mac_address+" type "+tempArray[iii].type_ppe);

                            break;

                        }
                        else {
                            tempArray[iii].type_ppe = 0;
                        }

                    }

                }

                _this.foundBeacons=tempArray;

                if (verbose) alert(JSON.stringify(_this.foundBeacons));

                $("#scanningWaiting").hide();
                $("#scanResults").show();
                $scope.$apply();
                //$scope.val = true;
                //alert("scan finished");
                //alert(JSON.stringify(_this.foundBeacons));
            }, 8000);


        };

        this.checkNearby = function() {

            var _this = this;

            this.foundBeacons = [];

            var tempArray = [];


            $("#checkResults").hide();
            $("#checkWaiting").show();
            $("#checkfunnyLoading").html(FunnyLoading());


            ble.scan([], 9, function(device) {

                //Add device to array
                tempArray.push(device);

            },function(error) {
                alert("something went wrong! "+error);
            });


            this.refresh_ppe_items();
            this.refresh_mac();

            $timeout(function() {

                var auxArray = [];

                for(var iii = 0; iii < tempArray.length; iii++) {

                    for(var ii = 0; ii < list_mac.length; ii++) {

                        if (tempArray[iii].id == list_mac[ii].mac_address) {

                            tempArray[iii].type_ppe = list_mac[ii].mac_ppe_id;

                            if (verbose) alert("Found match mac "+list_mac[ii].mac_address+" type "+tempArray[iii].type_ppe);

                            break;

                        }
                        else {
                            tempArray[iii].type_ppe = 0;
                        }

                    }

                    if (tempArray[iii].rssi>sensitivity) auxArray.push(tempArray[iii]);

                }

                _this.foundBeacons=auxArray;
                _this.ppe_items = list_ppe;


                if (verbose) alert(JSON.stringify(_this.foundBeacons));
                if (verbose) alert(JSON.stringify(_this.ppe_items));

                $("#checkWaiting").hide();
                $("#checkResults").show();

                $scope.$apply();

            }, 10000);

            $scope.$apply();
        };



        this.check_ok = function(type) {

            var isPresent = false;

            for(var ii = 0; ii < this.foundBeacons.length; ii++) {

                if (this.foundBeacons[ii].type_ppe == type) {
                    isPresent = true;
                    break;
                }
            }

            return isPresent;
            $scope.$apply();
        };



    });

    app.directive('homepage',function(){

        return {
            restrict: 'E',
            templateUrl: 'pages/home.html'

        };
    });

    app.directive('assignnearby',function(){

        return {
            restrict: 'E',
            templateUrl: 'pages/assign.html'

        };
    });

    app.directive('setupscan',['$timeout',function(){

        return {
            restrict: 'E',
            templateUrl: 'pages/setup.html'

        };


    }]);

    app.directive('results',function(){

        return {
            restrict: 'E',
            templateUrl: 'pages/results.html'

        };
    });



