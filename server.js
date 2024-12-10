const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Admin = require('./models/Admin');  
const Order = require('./models/Order');  
const Manager = require('./models/Manager');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://127.0.0.1:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

Product.updateMany({ category: { $exists: false } }, { $set: { category: 'default' } });
app.use(express.static(path.join(__dirname)));


app.post('/api/admins', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const newAdmin = new Admin({ name, email, password });
    await newAdmin.save();

    res.status(201).json({ success: true, message: 'Admin created successfully' });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin', error: error.message });
  }
});


app.post('/api/managers', async (req, res) => {
  try {
    const { name, email, password, productCategories, productModels, permissions } = req.body;

    if (!name || !email || !password || !Array.isArray(productCategories) || Object.keys(productModels).length === 0) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const newManager = new Manager({
      name,
      email,
      password,
      productCategories,
      productModels,
      permissions
    });

    await newManager.save();
    res.status(201).json({ success: true, message: 'Manager created successfully' });
  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(500).json({ success: false, message: 'Failed to create manager', error: error.message });
  }
});


app.get('/api/admins-managers', async (req, res) => {
  try {
    const admins = await Admin.find();
    const managers = await Manager.find();
    res.json([...admins, ...managers]);
  } catch (error) {
    res.status(500).send(error);
  }
});


app.post('/api/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    let user = await Admin.findOne({ email });
    if (!user) {
      user = await Manager.findOne({ email });
    }

    if (!user || user.password !== password) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    res.status(200).json({ success: true, message: 'Login successful', role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to login' });
  }
});



app.get('/api/admins', async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
});

app.get('/api/managers', async (req, res) => {
  try {
    const managers = await Manager.find();
    res.status(200).json(managers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch managers' });
  }
});

app.delete('/api/admins/:id', async (req, res) => {
  try {
    const adminId = req.params.id;
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.status(200).json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
});
app.put('/api/admins/:id', async (req, res) => {
  const adminId = req.params.id;
  console.log(`Updating admin with ID: ${adminId}`); 

  try {
      const updatedAdmin = await Admin.findByIdAndUpdate(adminId, req.body, { new: true });
      if (!updatedAdmin) {
          console.error(`Admin with ID ${adminId} not found`); 
          return res.status(404).send('Admin not found');
      }
      res.send(updatedAdmin);
  } catch (err) {
      console.error(`Failed to update admin: ${err}`); 
      res.status(500).send(err);
  }
});

app.put('/api/managers/:id', async (req, res) => {
    const managerId = req.params.id;
    console.log(`Updating manager with ID: ${managerId}`); 

    try {
        const updatedManager = await Manager.findByIdAndUpdate(managerId, req.body, { new: true });
        if (!updatedManager) {
            console.error(`Manager with ID ${managerId} not found`); 
            return res.status(404).send('Manager not found');
        }
        res.send(updatedManager);
    } catch (err) {
        console.error(`Failed to update manager: ${err}`); 
        res.status(500).send(err);
    }
});


app.delete('/api/managers/:id', async (req, res) => {
  try {
    const managerId = req.params.id;
    const deletedManager = await Manager.findByIdAndDelete(managerId);

    if (!deletedManager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    res.status(200).json({ success: true, message: 'Manager deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete manager' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});


app.get('/api/models', async (req, res) => {
  try {
    const category = req.query.category;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    const models = await Product.distinct('model', { category });
    res.status(200).json(models);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch models' });
  }
});


app.post('/api/products', async (req, res) => {
  try {
    const { title, price, image, category, model, description, characteristics } = req.body;

    const images = [image];
    for (let i = 1; i <= 3; i++) {
      images.push(image.replace('.jpg', `_${i}.jpg`));
    }

    const product = new Product({
      title,
      price,
      images,
      category,
      model,
      description,
      characteristics
    });

    const savedProduct = await product.save();
    res.status(201).json({ success: true, message: 'Product added successfully', product: savedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const { title, price, image, category, model, description, characteristics } = req.body;

    const images = [image];
    for (let i = 1; i <= 3; i++) {
      images.push(image.replace('.jpg', `_${i}.jpg`));
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        title,
        price,
        images,
        category,
        model,
        description,
        characteristics
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});


app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});


app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to register user' });
  }
});


app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    res.status(200).json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to login user' });
  }
});


app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch product details' });
  }
});


app.post('/api/orders', (req, res) => {
  const { username, email, cart } = req.body;

  if (!username || !email || !cart.length) {
    return res.status(400).json({ message: 'Invalid request' });
  }


  const newOrder = new Order({
    username,
    email,
    products: cart.map(item => ({
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      category: item.category,  
      model: item.model         
    })),
    totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    createdAt: new Date(),
  });

  newOrder.save()
    .then(() => res.status(200).json({ message: 'Purchase successful' }))
    .catch(err => res.status(500).json({ message: 'Failed to save order', error: err }));
});


app.get('/api/orders', async (req, res) => {
  try {
    const { status, sort, category, year, month, day, timeOfDay, sortByAmount } = req.query;

    let query = {};

 
    if (status) {
      query.status = status;
    }

   
    if (category) {
      query['products.category'] = category;
    }


    if (year) {
      query['createdAt'] = { ...query['createdAt'], $gte: new Date(`${year}-01-01`), $lt: new Date(`${parseInt(year) + 1}-01-01`) };
    }

    if (month) {
      const startMonth = `${year || new Date().getFullYear()}-${month}-01`;
      const endMonth = new Date(new Date(startMonth).setMonth(new Date(startMonth).getMonth() + 1));
      query['createdAt'] = { ...query['createdAt'], $gte: new Date(startMonth), $lt: endMonth };
    }

    if (day) {
      const startDay = `${year || new Date().getFullYear()}-${month || '01'}-${day}`;
      const endDay = new Date(new Date(startDay).setDate(new Date(startDay).getDate() + 1));
      query['createdAt'] = { ...query['createdAt'], $gte: new Date(startDay), $lt: endDay };
    }


    if (timeOfDay === 'AM') {
      query['createdAt'] = { ...query['createdAt'], $gte: new Date().setHours(0, 0, 0, 0), $lt: new Date().setHours(12, 0, 0, 0) };
    } else if (timeOfDay === 'PM') {
      query['createdAt'] = { ...query['createdAt'], $gte: new Date().setHours(12, 0, 0, 0), $lt: new Date().setHours(23, 59, 59, 999) };
    }

  
    let orders = await Order.find(query);

    
    if (sort) {
      orders = orders.sort((a, b) => {
        return sort === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    if (sortByAmount) {
      orders = orders.sort((a, b) => {
        return sortByAmount === 'asc'
          ? a.totalAmount - b.totalAmount
          : b.totalAmount - a.totalAmount;
      });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});


app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).send({ error: 'Order not found' });
    }
    res.send(order);
  } catch (error) {
    res.status(400).send({ error: 'Failed to update order status' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
