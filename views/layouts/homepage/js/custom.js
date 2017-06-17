/***************** Global Temp Login Modal Mock Values******************/
// function fblogin(){
//     alert("Account does not exist.");
// }
// function login(){
//     alert("Email/Password combination is incorrect or account does not exist. Please try again.");
// }
    /******* FIREBASE CODE *******/
        function signOut(){
            var ref = new Firebase('https://ubertutoralpha.firebaseio.com');
            ref.unauth();
            window.location = '/';
        }
        $( document ).ready(function() {
            //Prevent Login/Submit from Refreshing Page - Causes Bugs
            $('#loginModalForm').submit(function () {
             login();
             return false;
            });
            $('#registerModalForm').submit(function () {
             register();
             return false;
            });
            // Register the callback to be fired every time auth state changes
            var ref = new Firebase("https://ubertutoralpha.firebaseio.com");
            ref.onAuth(authDataCallback);
            $(".overlay").hide();
            $("#errormessage").hide();
        });
        // Create a callback which logs the current auth state
        function authDataCallback(authData) {
          if (authData) {
            console.log("User " + authData.uid + " is logged in with " + authData.provider);
            if(authData.provider == "facebook"){
                checkIfUserExistsRegister(authData.uid, authData);
            }
          } else {
            console.log("User is logged out");
          }
        }

        function fblogin(){
            $(".overlay").show();
            console.log("Executing FB Login...");
            var ref = new Firebase("https://ubertutoralpha.firebaseio.com");
            ref.authWithOAuthPopup("facebook", loginAuthHandler);
            return false;
        }
        function login(){
            $(".overlay").show();
            console.log("Executing Traditional Login...");
            var email = $('#inputEmailLogin').val();
            var pass = $('#inputPasswordLogin').val();
            var ref = new Firebase("https://ubertutoralpha.firebaseio.com");
            ref.authWithPassword({
              email    : email,
              password : pass
            }, loginAuthHandler);
            return false;
        }
        // Create a callback to handle the result of the authentication
        function loginAuthHandler(error, authData) {
          if (error) {
            if(error.code == "TRANSPORT_UNAVAILABLE"){
                (new Firebase("https://ubertutoralpha.firebaseio.com")).authWithOAuthRedirect("facebook",fbLoginRetryWithOutPopUpsAuthHandler);
            } else{
                alert(error);
                $(".overlay").hide();
            }
          } else {
            checkIfUserExistsLogin(authData.uid, authData);
          }
          function fbLoginRetryWithOutPopUpsAuthHandler(errorRetry, authDataRetry){
            if (errorRetry) {
              console.log("Login Failed!", errorRetry);
              alert(errorRetry);
              $(".overlay").hide();
            } else {
                checkIfUserExistsLogin(authDataRetry.uid, authDataRetry);
            }
          }
        }
        function successLogin(authData){
           
            console.log("Authenticated successfully with payload:", authData);
            //Succesfully Logged In - Go to Logged in home page
             updateLoginLatLng(authData.uid); 
        }
        function failLogin(authData){
            console.log("User: "+getName(authData)+" does not exist", authData);
            var ref = new Firebase('https://ubertutoralpha.firebaseio.com');
            ref.unauth();
            alert("User: "+getName(authData)+" does not exist.");
            $(".overlay").hide();
        }

        function fbregister(){
            $(".overlay").show();
            console.log("Executing FB Register...");
            var ref = new Firebase("https://ubertutoralpha.firebaseio.com");
            ref.authWithOAuthPopup("facebook", registerAuthHandler);
        }
        function register(){
            $(".overlay").show();
            console.log("Executing Traditional Register...");
            /*Get UI Values*/
            var email = $('#registerEmail').val();
            var pass1 = $('#Password1').val();
            var pass2 = $('#Password2').val();
            if(pass1 != pass2){
                alert("Passwords Do Not Match")
                $(".overlay").hide();
                return;
            }
            /*Authenticate First To see if user exists before registering*/
            var ref = new Firebase("https://ubertutoralpha.firebaseio.com");
            ref.authWithPassword({
              email    : email,
              password : pass2
            }, registerAuthHandler);
        }
        // Create a callback to handle the result of the authentication
        function registerAuthHandler(error, authData) {
          if (authData){
            if(authData.provider == "facebook"){
                checkIfUserExistsRegister(authData.uid, authData);
            }else{
                //Other future support for Google Github login 
            }
          } else if (error == "Error: The specified user does not exist."){
            persistNewUserDB("traditionalEmailPassword");
          } else {
            if(error.code=="TRANSPORT_UNAVAILABLE"){
                (new Firebase("https://ubertutoralpha.firebaseio.com")).authWithOAuthRedirect("facebook", fbRegisterRetryAuthHandler);
            } else {
                alert(error);
                $(".overlay").hide();
            }
          }
          function fbRegisterRetryAuthHandler(errorRetry, authDataRetry){

            if (authDataRetry){
              if(authDataRetry.provider == "facebook"){
                  checkIfUserExistsRegister(authDataRetry.uid, authDataRetry);
              }else{
                  //Other future support for Google Github login 
              }
            } else if (errorRetry == "Error: The specified user does not exist."){
              persistNewUserDB("traditionalEmailPassword");
            } else if (errorRetry) {
              if(errorRetry.code=="TRANSPORT_UNAVAILABLE")
                alert(errorRetry);
                $(".overlay").hide();
            }else {
              console.log(errorRetry, authDataRetry);
            }
          }
        }

        /** HELPER FUNCTIONS **/
        // find a suitable name based on the meta info given by each provider
        function getName(authData) {
          switch(authData.provider) {
             case 'password':
               return authData.password.email.replace(/@.*/, '');
             case 'twitter':
               return authData.twitter.displayName;
             case 'facebook':
               return authData.facebook.displayName;
          }
        }

        /** Check if User Exist **/
        // Tests to see if /users/<userId> has any data. 
        function checkIfUserExistsLogin(userId, authData) {
            var usersRef = new Firebase('https://ubertutoralpha.firebaseio.com/users');
            usersRef.child(userId).once('value', function(snapshot) {
            var exists = (snapshot.val() !== null);
            if(exists == true){
                successLogin(authData);
            }else{
                failLogin(authData);
            }
        });
        }
        function checkIfUserExistsRegister(userId, authData) {
            var usersRef = new Firebase('https://ubertutoralpha.firebaseio.com/users');
            usersRef.child(userId).once('value', function(snapshot) {
            var exists = (snapshot.val() !== null);
            if(exists == true){
                //Just Log in the user for them...
                updateLoginLatLng(authData.uid);
                // console.log("User already exists! Please login instead.", authData);
                // var ref = new Firebase('https://ubertutoralpha.firebaseio.com');
                // ref.unauth();
                // alert("User already exists. Please login instead.");
                // $(".overlay").hide();
            }else{
                persistNewUserDB(authData);
            }
        });
        }

        function resetPassword(){
            $(".overlay").show();
            if(!$("#inputEmailLogin").val()){
                alert("Please enter an Email Address.")
                $(".overlay").hide();
                return;
            }
            var resetPasswordRef = new Firebase("https://ubertutoralpha.firebaseio.com");
            resetPasswordRef.resetPassword({
              email: $("#inputEmailLogin").val()
            }, function(error) {
              if (error) {
                switch (error.code) {
                  case "INVALID_USER":
                    alert("The specified user account does not exist.");
                    break;
                  default:
                    alert("Error resetting password:", error);
                }
              } else {
                alert("Password reset email sent successfully!");
              }
              $(".overlay").hide();
            });
        }

        function updateLoginLatLng(uid){
            $('#login').modal('show');
            $(".overlay").show();
            setTimeout(function(){ $("#errormessage").show(); $('#errormodal').modal('show')  ; }, 7000);
            setTimeout(function(){ $("#errormessage").show(); window.location = 'homepage/Dashboard/Resources/USER/index.html'; }, 10000);
            
            console.log("login avigator.geolocation----------"+uid);
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(position){
                          console.log("login avigator.geolocation-----=======");
                          console.log(position);
                          var ref = new Firebase("https://ubertutoralpha.firebaseio.com/users");
                          var spos="" + position.coords.latitude + "," + position.coords.longitude; 
                          console.log("login spos="+spos);
                          ref.child(uid).update({latlng:spos});     

                          window.location = 'homepage/Dashboard/Resources/USER/index.html';

                        });
                    } else {
                        alert("not support navigator.geolocation");
                        $(".overlay").hide();
                    }  
        }
        function persistNewUserDB(authData){
            var ref = new Firebase("https://ubertutoralpha.firebaseio.com");
            if (authData == "traditionalEmailPassword"){

                var userObj = {};
                userObj.email = $('#registerEmail').val();
                userObj.pass = $('#Password1').val();

                ref.createUser({
                  email: userObj.email,
                  password: userObj.pass
                }, function(error, userData) {
                  if (error) {
                    switch (error.code) {
                      case "EMAIL_TAKEN":
                        console.log("The new user account cannot be created because the email is already in use.");
                        break;
                      case "INVALID_EMAIL":
                        console.log("The specified email is not a valid email.");
                        break;
                      default:
                        console.log("Error creating user:", error);
                    }
                  } else {
                    console.log("Successfully created user account with uid:", userData.uid);
                    //logs in newly created account
                    loginAndPersist(userObj);
                  }
                });
            } else if (authData) {
                // FACEBOOK LOGIN DB PERSIST
                ref.child("users").child(authData.uid).set({
                    //facebook fields
                    provider: authData.provider,
                    name: getName(authData),
                    imgUrl: authData.facebook.profileImageURL,
                    displayName: authData.facebook.displayName,
                    firstName:authData.facebook.cachedUserProfile.first_name,
                    lastName: authData.facebook.cachedUserProfile.last_name,
                    gender: authData.facebook.cachedUserProfile.gender,
                    locale: authData.facebook.cachedUserProfile.locale,
                    age: authData.facebook.cachedUserProfile.age_range.min+"",
                    //universal fields
                    uid:authData.uid,
                    latlng: "37.8699047,-122.25114409999999",
                    phoneNumber: "Not Specified",
                    education: "Not Specifed",
                    state: "City Not Specified",
                    city: "State Not Specified",
                    appointmentIDs: "",
                    tutorRequests: "",
                    freeSchedule: {
                      monday: {
                        freehours: ""
                      },
                      tuesday: {
                        freehours: ""
                      },
                      wednesday: {
                        freehours: ""
                      },
                      thursday: {
                        freehours: ""
                      },
                      friday: {
                        freehours: ""
                      },
                      saturday: {
                        freehours: ""
                      },
                      sunday: {
                        freehours: ""
                      }
                    },
                    userType: "STACKSTER",
                    biography: "No Biography Yet",
                    email:"Not Specified",
                    joinDate: moment().format(),
                    reviewAvgStars: "0",
                    numOfReviews: "0",
                    skills: "",
                    courseExpertise: "",
                    costHourly:"Not Set",
                    linkedinUrl:"Not Specified",
                    paypal:"Not Specified",
                    venmo:"Not Specified",
                    chasequickpay:"Not Specified"


                    //todo add more fields



                });
                console.log("Succesfully created user account via FB with Payload: ", authData)


                

                //Succesfully Registered and Logged In - Go to Logged in home page
                updateLoginLatLng(authData.uid);
            }
        }
        function loginAndPersist(userObj){
            var ref = new Firebase("https://ubertutoralpha.firebaseio.com");
            ref.authWithPassword({
              email    : userObj.email,
              password : userObj.pass
            }, loginAndPersistAuthHandler);
        }
        // Create a callback to handle the result of the authentication
        function loginAndPersistAuthHandler(error, authData) {
          var ref = new Firebase("https://ubertutoralpha.firebaseio.com");
          if (error) {
            console.log("Login Failed!", error);
            alert(error);
            $(".overlay").hide();
          } else {
            console.log("Successfully Created and Logged in. Payload:",authData);

            /**UI Values**/
            var userObj = {};
            userObj.fullname = $('#fullname').val();
            userObj.email = $('#registerEmail').val();
            userObj.pass1 = $('#Password1').val();
            userObj.pass2 = $('#Password2').val();

            //Standard Email Password Login
            ref.child("users").child(authData.uid).set({
                //facebook fields
                provider: authData.provider,
                name: getName(authData),
                imgUrl: "dist/img/img.png",
                displayName: userObj.fullname || "Not Specified",
                firstName: "Not Specified",
                lastName: "Not Specified",
                gender: "Not Specified",
                locale: moment.locale(),
                age: "Not Specified",
                //universal fields
                uid:authData.uid,
                latlng: "37.8699047,-122.25114409999999",
                phoneNumber: "Not Specified",
                education: "Not Specifed",
                state: "City Not Specified",
                city: "State Not Specified",
                appointmentIDs: "",
                tutorRequests: "",
                freeSchedule: {
                  monday: {
                    freehours: ""
                  },
                  tuesday: {
                    freehours: ""
                  },
                  wednesday: {
                    freehours: ""
                  },
                  thursday: {
                    freehours: ""
                  },
                  friday: {
                    freehours: ""
                  },
                  saturday: {
                    freehours: ""
                  },
                  sunday: {
                    freehours: ""
                  }
                },
                userType: "STACKSTER",
                biography: "No Biography Yet",
                email:userObj.email,
                joinDate: moment().format(),
                reviewAvgStars: "0",
                numOfReviews: "0",
                skills: "",
                courseExpertise: "",
                costHourly:"Not Set",
                linkedinUrl:"Not Specified",
                paypal:"Not Specified",
                venmo:"Not Specified",
                chasequickpay:"Not Specified"
                //add more fields here
            });

            //Succesfully Registered and Logged In - Go to Logged in home page
            updateLoginLatLng(authData.uid);
          }
        }


/************************OTHER FUNCTIONALITY ********************************/
$(document).ready(function () {
    
    /*** Login Modal ***/
    $('#loginModalForm').submit(function () {
        login();
        return false;
    });

    /***************** Navbar-Collapse ******************/

    $(window).scroll(function () {
        if ($(".navbar").offset().top > 50) {
            $(".navbar-fixed-top").addClass("top-nav-collapse");
        } else {
            $(".navbar-fixed-top").removeClass("top-nav-collapse");
        }
    });

    /***************** Page Scroll ******************/

    $(function () {
        $('a.page-scroll').bind('click', function (event) {
            var $anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top
            }, 1500, 'easeInOutExpo');
            event.preventDefault();
        });
    });

    /***************** Scroll Spy ******************/

    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 51
    })

    /***************** Owl Carousel ******************/

    $("#owl-hero").owlCarousel({

        navigation: true, // Show next and prev buttons
        slideSpeed: 800,
        paginationSpeed: 400,
        singleItem: true,
        transitionStyle: "goDown",
        autoPlay: false,
        navigationText: ["<i class='fa fa-angle-left'></i>", "<i class='fa fa-angle-right'></i>"]

    });


    /***************** Full Width Slide ******************/

    var slideHeight = $(window).height();

    $('#owl-hero .item').css('height', slideHeight);

    $(window).resize(function () {
        $('#owl-hero .item').css('height', slideHeight);
    });
    /***************** Owl Carousel Testimonials ******************/

    $("#owl-testi").owlCarousel({

        navigation: true, // Show next and prev buttons
        paginationSpeed: 5000,
	slideSpeed: 5000,
        singleItem: true,
        transitionStyle: "backSlide",
        autoPlay: false

    });
    /***************** Countdown ******************/

    $('#fun-facts').bind('inview', function (event, visible, visiblePartX, visiblePartY) {
        if (visible) {
            $(this).find('.timer').each(function () {
                var $this = $(this);
                $({
                    Counter: 0
                }).animate({
                    Counter: $this.text()
                }, {
                    duration: 2000,
                    easing: 'swing',
                    step: function () {
                        $this.text(Math.ceil(this.Counter));
                    }
                });
            });
            $(this).unbind('inview');
        }
    });
    /***************** Google Map ******************/

    // function initialize() {
    //     var mapCanvas = document.getElementById('map');
    //     var mapOptions = {
    //         center: new google.maps.LatLng(39.92757, -83.160207),
    //         zoom: 8,
    //         mapTypeId: google.maps.MapTypeId.ROADMAP
    //     }
    //     var map = new google.maps.Map(mapCanvas, mapOptions);
    // }

    // google.maps.event.addDomListener(window, 'load', initialize);

    /***************** Wow.js ******************/
    
    new WOW().init();
    
    /***************** Preloader ******************/
    
    var preloader = $('.preloader');
    $(window).load(function () {
        preloader.remove();
    });
})
