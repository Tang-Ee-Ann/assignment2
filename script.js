$(document).ready(function(){
    $(window).scroll(function(){
        // sticky navbar on scroll script
        if(this.scrollY > 20){
            $('.navbar').addClass("sticky");
        }else{
            $('.navbar').removeClass("sticky");
        }

        // scroll-up button show/hide script
        if(this.scrollY > 500){
            $('.scroll-up-btn').addClass("show");
        }else{
            $('.scroll-up-btn').removeClass("show");
        }
    });

    // slide-up script
    $('.scroll-up-btn').click(function(){
        $('html').animate({scrollTop: 0});
        // removing smooth scroll on slide-up button click
        $('html').css("scrollBehavior", "auto");
    });

    $('.navbar .menu li a').click(function(){
        // applying again smooth scroll on menu items click
        $('html').css("scrollBehavior", "smooth");
    });

    // toggle menu/navbar script
    $('.menu-btn').click(function(){
        $('.navbar .menu').toggleClass("active");
        $('.menu-btn i').toggleClass("active");
    });

    // typing text animation script
    var typed = new Typed(".typing", {
        strings: ["T-Shirts", "Shorts", "Memorabilias"],
        typeSpeed: 100,
        backSpeed: 60,
        loop: true
    });

    var typed = new Typed(".typing-2", {
        strings: ["Trendy", "Fashionable", "Classy"],
        typeSpeed: 100,
        backSpeed: 60,
        loop: true
    });

    // owl carousel script
    $('.carousel').owlCarousel({
        margin: 20,
        loop: true,
        autoplay: true,
        autoplayTimeOut: 2000,
        autoplayHoverPause: true,
        responsive: {
            0:{
                items: 1,
                nav: false
            },
            600:{
                items: 2,
                nav: false
            },
            1000:{
                items: 3,
                nav: false
            }
        }
    });

    // Button Alert
    document.getElementById("sendmessage").addEventListener("click", myFunction);

    function myFunction() {
      alert("Message has been sent!");
      document.getElementById('requestform').value = "Name"
      document.getElementById('requestform1').value = "Email"
      document.getElementById('requestform2').value = "Subject"
      document.getElementById('requestform3').value = "Message.."
    }




});

// SHOP

if (document.readyState == 'loading') {
  document.addEventListener('DOMContentLoaded', ready)
}else{
  ready()
}

function ready(){
  var removeCartItemButtons = document.getElementsByClassName("btn-danger")
  for (var i=0; i< removeCartItemButtons.length; i++){
    var button = removeCartItemButtons[i]
      button.addEventListener('click',removeCartItem)
    }

    var quantityInputs = document.getElementsByClassName("cart-quantity-input")
    for (var i = 0; i < quantityInputs.length; i++) {
      var input = quantityInputs[i]
      input.addEventListener("change",quantityChanged)
    }

    var addToCartButtons = document.getElementsByClassName("shop-item-button")
    for (var i = 0; i < addToCartButtons.length; i++){
      var button = addToCartButtons[i]
      button.addEventListener("click",addToCartClicked)
    }

    document.getElementsByClassName("btn-purchase")[0].addEventListener("click",purchaseClicked)


  }

function purchaseClicked(){
  alert("Thank you for your purchase!")
  var cartItems = document.getElementsByClassName('cart-items')[0]
  while(cartItems.hasChildNodes()){
    cartItems.removeChild(cartItems.firstChild)
  }
  updateCartTotal()

}

function removeCartItem(event){
  var buttonClicked = event.target
  buttonClicked.parentElement.parentElement.remove()
  updateCartTotal()
}

function quantityChanged(event){
  var input = event.target
  if(isNaN(input.value) || input.value <= 0){
    input.value = 1
  }
  updateCartTotal()
}

function addToCartClicked(event){
  var button = event.target
  var shopItem= button.parentElement.parentElement
  var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
  var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
  var imageSrc = shopItem.getElementsByClassName('shop-item-image')[0].src
  console.log(title,price,imageSrc)
  addItemToCart(title, price, imageSrc)
  updateCartTotal()
}

function addItemToCart(title, price, imageSrc){
  var cartRow = document.createElement('div')
  cartRow.classList.add('cart-row')
  var cartItems = document.getElementsByClassName('cart-items')[0]
  var cartItemNames = cartItems.getElementsByClassName("cart-item-title")
  for(var i = 0; i < cartItemNames.length; i++){
    if(cartItemNames[i].innerText == title){
      alert("Item Has Been Added Already")
      return
    }
  }
  var cartRowContents = `
  <div class="cart-item cart-column">
    <img class="cart-item-image" src="${imageSrc}" width="100" height = "100">
    <span class="cart-item-title">${title}</span>
  </div>
  <span class="cart-price cart-column">${price}</span>
  <div class="cart-quantity cart-column">
    <input class="cart-quantity-input" type="number" value="1">
    <button class="btn btn-danger" types="button">REMOVE</button>
  </div>`
  cartRow.innerHTML = cartRowContents
  cartItems.append(cartRow)
  cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click',removeCartItem)
  cartRow.getElementsByClassName("cart-quantity-input")[0].addEventListener
  ('change',quantityChanged)
}

//* total price //
function updateCartTotal(){
  var cartItemContainer = document.getElementsByClassName("cart-items")[0]
  var cartRows = cartItemContainer.getElementsByClassName("cart-row")
  var total = 0
  for(var i = 0; i< cartRows.length; i++){
    var cartRow = cartRows[i]
    var priceElement = cartRow.getElementsByClassName("cart-price")[0]
    var quantityELement = cartRow.getElementsByClassName("cart-quantity-input")[0]
    var price = parseFloat(priceElement.innerText.replace('$',''))
    var quantity = quantityELement.value
    total = total + (price * quantity)
  }
  total = Math.round(total * 100) / 100
  document.getElementsByClassName("cart-total-price")[0].innerText = '$' + total


}
