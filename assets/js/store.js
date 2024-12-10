new Vue({
  el: '#app',
  data: {
    appTitle: 'AUTO EXPRESS',
    products: [],
    filteredProducts: [],
    cart: [],
    categories: [],
    models: [],
    filteredModels: [],
    selectedCategory: '',
    selectedModel: '',
    currentPage: 1,
    itemsPerPage: 10,
    isCartVisible: false,
    activeImages: {},  
    username: '',  
    email: '',  
  },
  computed: {
    paginatedProducts() {
      let start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredProducts.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    },
    total() {
      return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
  },
  mounted() {
    this.fetchProducts();
    this.loadCartFromCookies();  
  },
  methods: {
    fetchProducts() {
      fetch('/api/products')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch products');
          }
          return response.json();
        })
        .then(data => {
          this.products = data.map(product => {
           
            if (!product.images) {
              product.images = [product.image];
              for (let i = 1; i <= 3; i++) {
                product.images.push(product.image.replace('.jpg', `_${i}.jpg`));
              }
            }
            this.$set(this.activeImages, product._id, 0);  
            return product;
          });
          this.filteredProducts = this.products;
          this.extractCategories();
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Failed to fetch products');
        });
    },
    addItem(prod) {
      let cartItem = this.cart.find(item => item._id === prod._id);
      if (cartItem) {
        cartItem.quantity++;
      } else {
        this.cart.push({ ...prod, quantity: 1 });
      }
      this.saveCartToCookies();  
    },
    add(item) {
      item.quantity++;
      this.saveCartToCookies();  
    },
    sub(item) {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        this.cart = this.cart.filter(cartItem => cartItem._id !== item._id);
      }
      this.saveCartToCookies();  
    },
    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },
    toggleCartVisibility() {
      this.isCartVisible = !this.isCartVisible;
    },
    saveCartToCookies() {
      Cookies.set('cart', JSON.stringify(this.cart), { expires: 7 });
    },
    loadCartFromCookies() {
      const savedCart = Cookies.get('cart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
      }
    },
    purchase() {
      if (!this.username || !this.email) {
        alert('Please enter your name and email to proceed with the purchase.');
        return;
      }

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          email: this.email,
          cart: this.cart,
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to complete purchase');
          }
          return response.json();
        })
        .then(data => {
          alert('Purchase successful');
          this.cart = [];  
          this.saveCartToCookies();  
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Failed to complete purchase');
        });
    },
    extractCategories() {
      this.categories = [...new Set(this.products.map(product => product.category))];
    },
    extractModels() {
      if (this.selectedCategory) {
        this.filteredModels = [...new Set(this.products.filter(product => product.category === this.selectedCategory).map(product => product.model))];
      } else {
        this.filteredModels = [];
      }
    },
    filterByCategory() {
      if (this.selectedCategory) {
        this.filteredProducts = this.products.filter(product => product.category === this.selectedCategory);
        this.extractModels();
      } else {
        this.filteredProducts = this.products;
        this.filteredModels = [];
      }
      this.selectedModel = '';  
      this.currentPage = 1;  
    },
    filterByModel() {
      if (this.selectedModel) {
        this.filteredProducts = this.products.filter(product => product.model === this.selectedModel && product.category === this.selectedCategory);
      } else {
        this.filterByCategory();  
      }
      this.currentPage = 1; 
    },
    setActiveImage(productId, index) {
      this.$set(this.activeImages, productId, index);
    },

    prevImage(productId) {
      if (this.activeImages[productId] > 0) {
        this.$set(this.activeImages, productId, this.activeImages[productId] - 1);
      }
    },
    nextImage(productId) {
      if (this.activeImages[productId] < this.products.find(p => p._id === productId).images.length - 1) {
        this.$set(this.activeImages, productId, this.activeImages[productId] + 1);
      }
    },
    setImage(productId, index) {
      this.$set(this.activeImages, productId, index);
    },
  },
  filters: {
    currency(value) {
      return '$' + value.toFixed(2);
    }
  }
});
