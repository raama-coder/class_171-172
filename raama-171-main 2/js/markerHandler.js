var tableNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function () {
    console.log("1")
    //Get Table Number
    if (tableNumber === null) {
      console.log("2")
      this.askTableNumber();
      console.log("3")
    }

    //Get the dishes collection
    var dishes = await this.getDishes();

    //makerFound Event
    this.el.addEventListener("markerFound", () => {
      if (tableNumber !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(dishes, markerId);
      }
    });
    //markerLost Event
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  askTableNumber: function () {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title: "Welcome to Hunger!!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your table number",
          type: "number",
          min: 1
        }
      },
      closeOnClickOutside: false,
    }).then(inputValue => {
      tableNumber = inputValue;
    });
  },

  handleMarkerFound: function (dishes, markerId) {
    // Getting today's day
    var todaysDate = new Date();
    var todaysDay = "sunday"
    // todaysDate.getDay();

    // sunday - saturday : 0 - 6
    var days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

    //Get the dish based on ID
    var dish = dishes.filter(dish => dish.id === markerId)[0];

    //Check if the dish is available today
    if (dish.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: dish.dish_name.toUpperCase(),
        text: "This dish is not available today!!!",
        timer: 2500,
        buttons: false
      });
    } else {
      //Changing Model scale to initial scale
      var model = document.querySelector(`#model-${dish.id}`);
      model.setAttribute("position", dish.model_geometry.position);
      model.setAttribute("rotation", dish.model_geometry.rotation);
      model.setAttribute("scale", dish.model_geometry.scale);

      //Update UI conent VISIBILITY of AR scene(MODEL , INGREDIENTS & PRICE)      
      model.setAttribute("visible", true);

      var ingredientsContainer = document.querySelector(`#main-plane-${dish.id}`);
      ingredientsContainer.setAttribute("visible", true);

      var priceplane = document.querySelector(`#price-plane-${dish.id}`);
      priceplane.setAttribute("visible", true)

      //Changing button div visibility
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");

      if (tableNumber != null) {
        //Handling Click Events
        ratingButton.addEventListener("click", function () {
          swal({
            icon: "warning",
            title: "Rate Dish",
            text: "Work In Progress"
          });
        });
        
        orderSummaryButtton.addEventListener("click",()=>{
          this.handleOrderSummary()
        })

        orderButtton.addEventListener("click", () => {
          var tNumber;
          tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;
          this.handleOrder(tNumber, dish);

          swal({
            icon: "https://i.imgur.com/4NZ6uLY.jpg",
            title: "Thanks For Order !",
            text: "Your order will serve soon on your table!",
            timer: 2000,
            buttons: false
          });
        });
      }
    }
  },

  handleOrderSummary: async function(){
    var modalDiv=document.getElementById("modal-div")
    modalDiv.style.display="flex"
    var tableBodyTag=document.getElementById("bill-table-body")
    tableBodyTag.innerHTML=""
    var tableNumber
    tableNumber<=9?(tableNumber=`T0${tableNumber}`):(`T${tableNumber}`)
    this.getOrderSummary()
    var orderSummary=await this.getOrderSummary(tableNumber)
    console.log("a")
    console.log("b")
    var currentOrders=Object.keys(orderSummary.current_orders)
    currentOrders.map(i=>{
      var tr=document.createElement("tr")
      var item=document.createElement("td")
      var price=document.createElement("td")
      var quantity=document.createElement("td")
      var total=document.createElement("td")
      item.innerHTML=orderSummary.current_orders[i].item
      price.innerHTML="$"+orderSummary.current_orders[i].price
      price.setAttribute("class", "text-center")
      quantity.innerHTML=orderSummary.current_orders[i].quantity
      quantity.setAttribute("class", "text-center")
      console.log(orderSummary.current_orders[i].quantity+"quantity")
      total.innerHTML="$"+orderSummary.current_orders[i].subtotal
      total.setAttribute("class", "text-center")
      console.log("a1")
      tr.appendChild(item)
      tr.appendChild(price)
      tr.appendChild(quantity)
      tr.appendChild(total)
      tableBodyTag.appendChild(tr)
      var totalTr=document.createElement("tr")
      var td1=document.createElement("td")
      td1.setAttribute("class", "no-line")
      var td2=document.createElement("td")
      td2.setAttribute("class", "no-line")
      var td3=document.createElement("td")
      td3.setAttribute("class", "no-line text-center")
      var strongt=document.createElement("strong")
      strongt.innerHTML="total"
      td3.appendChild(strongt)
      var td4=document.createElement("td")
      td4.setAttribute("class", "no-line text-center")
      strongt.innerHTML="$"+orderSummary.total_bill
      totalTr.appendChild(td1)
      totalTr.appendChild(td2)
      totalTr.appendChild(td3)
      totalTr.appendChild(td4)
      tableBodyTag.appendChild(totalTr)
    })
  },

  getOrderSummary:async function(tableNumber){
    console.log("d")
    var sum= await firebase.firestore().collection("tables").doc(tableNumber).get().then(doc=>doc.data())
    console.log(sum)
    return sum
  },

  handleOrder: function (tNumber, dish) {
    // Reading current table order details
    firebase
      .firestore()
      .collection("tables")
      .doc(tNumber)
      .get()
      .then(doc => {
        var details = doc.data();

        if (details["current_orders"][dish.id]) {
          // Increasing Current Quantity
          details["current_orders"][dish.id]["quantity"] += 1;

          //Calculating Subtotal of item
          var currentQuantity = details["current_orders"][dish.id]["quantity"];

          details["current_orders"][dish.id]["subtotal"] =
            currentQuantity * dish.price;
        } else {
          details["current_orders"][dish.id] = {
            item: dish.dish_name,
            price: dish.price,
            quantity: 1,
            subtotal: dish.price * 1
          };
        }

        details.total_bill += dish.price;

        //Updating db
        firebase
          .firestore()
          .collection("tables")
          .doc(doc.id)
          .update(details);
      });
  },
  //Function to get the dishes collection from db
  getDishes: async function () {
    return await firebase
      .firestore()
      .collection("Dishes")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  handleMarkerLost: function () {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
