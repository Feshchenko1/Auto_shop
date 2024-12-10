new Vue({
  el: '#app',
  data() {
    return {
      currentView: 'products',
      products: [],
      admins: [],
      orders: [], 
      categories: [],
      models: [],
      selectedCategory: '',
      selectedModel: '',
      selectedRole: '',
      selectedEditCategory: '', 
      filterStatus: '',   
      filterDate: '',     
      filterCategory: '',
      filterModel: '',   
      filteredModels: [], 
      filterYear: '',
      filterMonth: '',
      filterDay: '',
      filterTimeOfDay: '',  
      sortByAmount: '',      
      availableYears: [], 
      selectedCategories: [],   
      showAddModal: false,
      showEditModal: false,
      showDeleteModal: false,
      showAdminModal: false,
      showEditAdminModal: false,
      showDeleteAdminModal: false,
      showDeleteOrderModal: false,
      newProduct: this.getEmptyProduct(),
      newAdmin: this.getEmptyAdmin(),
      newOrder: this.getEmptyOrder(), 
      currentProduct: {},
      currentAdmin: {
        productCategories: [], 
        productModels: {},     
        permissions: {
          canCreate: false,
          canDelete: false
        }
      },
      currentOrder: {}, 
      adminsAndManagers: [],
      productIdToDelete: '',
      adminIdToDelete: '',
      filteredModels: [], 
      categoryModelSelection: [], 


    };
  },
  computed: {
    
    filteredModels(category) {
      return this.models.filter(model => model.category === category);
  },
    filteredProducts() {
      return this.products
        .filter(product => !this.selectedCategory || product.category === this.selectedCategory)
        .filter(product => !this.selectedModel || product.model === this.selectedModel);
    },
    filteredModelsForSelectedCategory() {
      return this.filteredModels.map(model => ({ label: model, value: model })).concat([{ label: "All", value: "all" }]);
    },
    filteredAdminsAndManagers() {
      return this.adminsAndManagers
        .filter(admin => !this.selectedRole || admin.role === this.selectedRole)
        .sort((a, b) => a.role === 'manager' ? -1 : 1);
    },

 filteredOrders() {
  let filtered = this.orders;


  if (this.filterStatus) {
    filtered = filtered.filter(order => order.status === this.filterStatus);
  }


      if (this.filterCategory) {
        filtered = filtered.filter(order =>
          order.products.some(product => product.category === this.filterCategory)
        );
      }

      if (this.filterModel) {
        filtered = filtered.filter(order =>
          order.products.some(product => product.model === this.filterModel)
        );
      }


  if (this.filterYear) {
    filtered = filtered.filter(order => new Date(order.createdAt).getFullYear() === parseInt(this.filterYear));
  }

  if (this.filterMonth) {
    filtered = filtered.filter(order => {
      const orderMonth = String(new Date(order.createdAt).getMonth() + 1).padStart(2, '0');
      return orderMonth === this.filterMonth;
    });
  }

  if (this.filterDay) {
    filtered = filtered.filter(order => new Date(order.createdAt).getDate() === parseInt(this.filterDay));
  }

  if (this.filterTimeOfDay) {
    filtered = filtered.filter(order => {
      const hours = new Date(order.createdAt).getHours();
      return this.filterTimeOfDay === 'AM' ? hours < 12 : hours >= 12;
    });
  }

  if (this.filterDate) {
    filtered = filtered.slice().sort((a, b) => {
      return this.filterDate === 'asc'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  if (this.sortByAmount) {
    filtered = filtered.slice().sort((a, b) => {
      return this.sortByAmount === 'asc'
        ? a.totalAmount - b.totalAmount
        : b.totalAmount - a.totalAmount;
    });
  }

  return filtered;
},
  },
  methods: {
    getEmptyProduct() {
      return {
        title: '',
        price: 0,
        image: '',
        category: '',
        model: '',
        description: '',
        characteristics: ''
      };
    },
    getEmptyAdmin() {
      return {
        name: '',
        email: '',
        password: '',
        role: '', 
        permissions: {
          canCreate: false,
          canDelete: false
        }
      };
    },

    getEmptyOrder() { 
      return {
        username: '',
        email: '',
        products: [],
        totalAmount: 0,
        createdAt: new Date()
      };
    },
    fetchProducts() {
      axios.get('/api/products')
        .then(response => {
          this.products = response.data;
          this.categories = [...new Set(this.products.map(product => product.category))];
          this.models = [...new Set(this.products.map(product => product.model))];
          this.updateFilteredModels();
        })
        .catch(error => {
          console.error('Failed to fetch products:', error);
        });
    },
    fetchAdminsAndManagers() {
      axios.get('/api/admins-managers')
        .then(response => {
          this.adminsAndManagers = response.data;
          this.admins = response.data;
          this.filterByRole();
        })
        .catch(error => {
          console.error('Failed to fetch admins and managers:', error);
        });
    },
    fetchOrders() {
      axios.get('/api/orders')
        .then(response => {
          this.orders = response.data;

          
          this.availableYears = [...new Set(this.orders.map(order => new Date(order.createdAt).getFullYear()))];
        })
        .catch(error => {
          console.error('Failed to fetch orders:', error);
        });
    },
    createProduct() {
      axios.post('/api/products', this.newProduct)
        .then(response => {
          this.products.push(response.data.product);
          this.closeAddModal();
        })
        .catch(error => {
          console.error('Failed to add product:', error);
        });
    },
    editProduct(product) {
      this.currentProduct = { ...product };
      this.showEditModal = true;
    },
    updateProduct() {
      axios.put(`/api/products/${this.currentProduct._id}`, this.currentProduct)
        .then(response => {
          const index = this.products.findIndex(p => p._id === response.data.product._id);
          this.$set(this.products, index, response.data.product);
          this.closeEditModal();
        })
        .catch(error => {
          console.error('Failed to update product:', error);
        });
    },
    confirmDeleteProduct(productId) {
      this.productIdToDelete = productId;
      this.showDeleteModal = true;
    },
    confirmDeleteOrder(orderId) { 
      this.orderIdToDelete = orderId;
      this.showDeleteOrderModal = true;
    },
    deleteProduct() {
      axios.delete(`/api/products/${this.productIdToDelete}`)
        .then(() => {
          this.products = this.products.filter(p => p._id !== this.productIdToDelete);
          this.closeDeleteModal();
        })
        .catch(error => {
          console.error('Failed to delete product:', error);
        });
    },


    onRoleChange() {
    if (this.newAdmin.role === 'manager') {
   
      this.newAdmin.productCategories = [];
      this.newAdmin.productModels = {};
      this.selectedCategory = '';
      this.selectedModel = [];
    }
  },

  createAdminOrManager() {
    const payload = {
      name: this.newAdmin.name,
      email: this.newAdmin.email,
      password: this.newAdmin.password,
      role: this.newAdmin.role,
      permissions: this.newAdmin.permissions,
      productCategories: this.newAdmin.role === 'manager' ? this.categoryModelSelection.map(selection => selection.category) : [],
      productModels: this.newAdmin.role === 'manager' ? this.categoryModelSelection.reduce((acc, selection) => {
        acc[selection.category] = selection.models;
        return acc;
      }, {}) : {}
    };

    axios.post(this.newAdmin.role === 'manager' ? '/api/managers' : '/api/admins', payload)
      .then(response => {
        this.admins.push(response.data);
        this.closeAdminModal();
      })
      .catch(error => {
        console.error('Failed to create admin/manager:', error);
        alert(`Failed to create ${this.newAdmin.role}. ${error.response?.data?.message || ''}`);
      });
  },
    editAdmin(admin) {
      this.currentAdmin = { ...admin };
      this.showEditAdminModal = true;
    },
    updateAdmin() {
      console.log("Updating admin:", this.currentAdmin); 
      const endpoint = this.currentAdmin.role === 'manager' ? '/api/managers' : '/api/admins';
      const url = `${endpoint}/${this.currentAdmin._id}`;
  
      console.log("PUT URL:", url); 
  
      axios.put(url, this.currentAdmin)
          .then(response => {
              const index = this.admins.findIndex(a => a._id === response.data._id);
              this.$set(this.admins, index, response.data);
              this.closeEditAdminModal();
          })
          .catch(error => {
              console.error('Failed to update admin/manager:', error);
          });
  },
  onCategoryChange() {
    this.updateFilteredModels();
    this.filterOrders(); 
  },
  updateFilteredModels() {
    if (this.selectedCategory) {
      this.filteredModels = [...new Set(this.products
        .filter(product => product.category === this.selectedCategory)
        .map(product => product.model))];
    } else {
      this.filteredModels = [...new Set(this.products.map(product => product.model))];
    }

    this.filteredModels.push('all');
  },

  toggleModelSelection(model) {
    if (this.selectedModel.includes(model)) {
      
      this.selectedModel = this.selectedModel.filter(m => m !== model);
    } else {
     
      this.selectedModel.push(model);
    }
  },

  toggleAllModels() {
    if (this.selectedModel.includes('all')) {
     
      this.selectedModel = [];
    } else {
     
      this.selectedModel = ['all'];
    }
  },
  saveSelection() {
    if (!this.selectedCategory || this.selectedModel.length === 0) {
      alert("Please select a category and at least one model.");
      return;
    }

  
    const existingIndex = this.categoryModelSelection.findIndex(selection => selection.category === this.selectedCategory);

    if (existingIndex > -1) {
      this.categoryModelSelection[existingIndex].models = this.selectedModel;
    } else {
      this.categoryModelSelection.push({
        category: this.selectedCategory,
        models: [...this.selectedModel]
      });
    }


    this.selectedCategory = '';
    this.selectedModel = [];
  },

  removeCategory(index) {
    this.categoryModelSelection.splice(index, 1);
  },

  toggleOrderStatus(order) {
    const newStatus = order.status === 'Completed' ? 'Pending' : 'Completed';
    axios.put(`/api/orders/${order._id}/status`, { status: newStatus })
      .then(response => {
        order.status = response.data.status;
      })
      .catch(error => {
        console.error('Failed to update order status:', error);
      });
  },
    confirmDeleteAdmin(adminId) {
      this.adminIdToDelete = adminId;
      this.showDeleteAdminModal = true;
    },


  toggleModelEdit(category, model) {
    if (!this.currentAdmin.productModels[category]) {
      this.$set(this.currentAdmin.productModels, category, []);
    }

    const index = this.currentAdmin.productModels[category].indexOf(model);
    if (index > -1) {
      this.currentAdmin.productModels[category].splice(index, 1);
    } else {
      this.currentAdmin.productModels[category].push(model);
    }
  },

  toggleAllModelsEdit(category) {
    if (!this.currentAdmin.productModels[category]) {
      this.$set(this.currentAdmin.productModels, category, []);
    }

    if (this.currentAdmin.productModels[category].includes('all')) {
      this.currentAdmin.productModels[category] = []; 
    } else {
      this.currentAdmin.productModels[category] = ['all']; 
    }
  },


  addCategoryToAdmin() {
    if (!this.selectedEditCategory || this.currentAdmin.productModels[this.selectedEditCategory]) return;

    this.$set(this.currentAdmin.productModels, this.selectedEditCategory, []);
    this.selectedEditCategory = ''; 
  },


  removeCategoryFromAdmin(category) {
    this.$delete(this.currentAdmin.productModels, category);
  },

 
  getCategoryModels(category) {
    return this.products
      .filter(product => product.category === category)
      .map(product => product.model);
  },


  updateAdmin() {

    this.currentAdmin.productCategories = Object.keys(this.currentAdmin.productModels);

    const endpoint = this.currentAdmin.role === 'manager' ? '/api/managers' : '/api/admins';
    const url = `${endpoint}/${this.currentAdmin._id}`;

    axios.put(url, this.currentAdmin)
      .then(response => {
        const index = this.admins.findIndex(admin => admin._id === response.data._id);
        this.$set(this.admins, index, response.data);
        this.closeEditAdminModal();
      })
      .catch(error => {
        console.error('Failed to update admin/manager:', error);
      });
  },
  
  editAdmin(admin) {
    this.currentAdmin = JSON.parse(JSON.stringify(admin));
    this.showEditAdminModal = true;
  },

    deleteAdmin() {
      const admin = this.admins.find(a => a._id === this.adminIdToDelete);
  
      if (!admin) {
          console.error(`Admin with ID ${this.adminIdToDelete} not found`);
          return;
      }
  
      const endpoint = admin.role === 'manager' ? '/api/managers' : '/api/admins';
  
      axios.delete(`${endpoint}/${this.adminIdToDelete}`)
          .then(() => {
              this.admins = this.admins.filter(a => a._id !== this.adminIdToDelete);
              this.closeDeleteAdminModal();
          })
          .catch(error => {
              console.error('Failed to delete admin/manager:', error);
          });
  },
  deleteOrder() { 
    axios.delete(`/api/orders/${this.orderIdToDelete}`)
      .then(() => {
        this.orders = this.orders.filter(o => o._id !== this.orderIdToDelete);
        this.closeOrderModal();
      })
      .catch(error => {
        console.error('Failed to delete order:', error);
      });
  },
    filterByCategory() {
      this.fetchProducts();
    },
    filterByModel() {
      this.fetchProducts();
    },
    filterByRole() {
      this.fetchAdminsAndManagers();
    },
    filterOrders() {

      this.filteredOrders();
    },
    focusOnOrderManagers() {
      this.selectedRole = 'manager';
      this.filterByRole();
    },
    openAddModal() {
      this.showAddModal = true;
    },
    
    closeAddModal() {
      this.showAddModal = false;
      this.newProduct = this.getEmptyProduct();
    },
    openOrderModal() { 
      this.showOrderModal = true;
    },
    closeOrderModal() { 
      this.showDeleteOrderModal = false;
      this.newOrder = this.getEmptyOrder();
    },
    openAdminModal() {
      this.showAdminModal = true;
    },
    closeAdminModal() {
      this.showAdminModal = false;
      this.newAdmin = this.getEmptyAdmin();
    },
    closeEditAdminModal() {
      this.showEditAdminModal = false;
      this.currentAdmin = {};
    },
    closeDeleteAdminModal() {
      this.showDeleteAdminModal = false;
      this.adminIdToDelete = '';
    },
    closeEditModal() {
      this.showEditModal = false;
      this.currentProduct = {};
    },
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.productIdToDelete = '';
    }
  },
  created() {
    this.fetchProducts();
    this.fetchAdminsAndManagers();
    this.fetchOrders();
  }
});
