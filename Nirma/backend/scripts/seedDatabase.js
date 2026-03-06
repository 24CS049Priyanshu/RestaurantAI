const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' }); // Adjusted for scripts folder

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'restaurant_user',
    password: process.env.DB_PASSWORD || 'rest123',
});

async function seedDatabase() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Seeding database with realistic data for AI testing...');

        // 1. Clear existing data
        await client.query(`
            TRUNCATE TABLE 
                price_recommendations, combo_rules, ai_item_metrics, payments, 
                order_items, orders, menu_items, menu_categories, 
                otp_verifications, customers, users, restaurants 
            RESTART IDENTITY CASCADE;
        `);

        // 2. Insert Restaurant
        const restResult = await client.query(`
            INSERT INTO restaurants (name, location, contact_number, email, description, cuisine_type)
            VALUES ('The Tech Bistro', 'Silicon Valley', '9998887776', 'hello@techbistro.com', 'A modern tech-themed restaurant', 'Multi-Cuisine')
            RETURNING id;
        `);
        const restaurantId = restResult.rows[0].id;

        // 3. Insert Users (Admin & Manager)
        const passwordHash = await bcrypt.hash('admin123', 10);
        await client.query(`
            INSERT INTO users (name, email, password, phone, role, restaurant_id)
            VALUES 
                ('Super Admin', 'admin@techbistro.com', $1, '9000000001', 'admin', $2),
                ('Store Manager', 'manager@techbistro.com', $1, '9000000002', 'restaurant_manager', $2);
        `, [passwordHash, restaurantId]);

        // 4. Insert Categories
        const categoriesResult = await client.query(`
            INSERT INTO menu_categories (restaurant_id, category_name, description, display_order)
            VALUES 
                ($1, 'Burgers', 'Gourmet burgers', 1),
                ($1, 'Pizza', 'Wood-fired pizzas', 2),
                ($1, 'Sides', 'Fries and more', 3),
                ($1, 'Drinks', 'Refreshing beverages', 4),
                ($1, 'Desserts', 'Sweet treats', 5)
            RETURNING id, category_name;
        `, [restaurantId]);

        const catMap = {};
        categoriesResult.rows.forEach(c => catMap[c.category_name] = c.id);

        // 5. Insert Menu Items
        const menuItemsData = [
            // Burgers
            { cat: 'Burgers', name: 'Classic Burger', desc: 'Beef patty, lettuce, tomato', price: 120, cost: 40, icon: '🍔' },
            { cat: 'Burgers', name: 'Cheese Burger', desc: 'Classic with double cheese', price: 150, cost: 50, icon: '🍔' },
            { cat: 'Burgers', name: 'Spicy Chicken Burger', desc: 'Crispy chicken, spicy mayo', price: 140, cost: 45, icon: '🍔' },
            // Pizza
            { cat: 'Pizza', name: 'Margherita', desc: 'Classic cheese and tomato', price: 250, cost: 80, icon: '🍕' },
            { cat: 'Pizza', name: 'Pepperoni', desc: 'Lots of pepperoni', price: 300, cost: 100, icon: '🍕' },
            { cat: 'Pizza', name: 'BBQ Chicken', desc: 'Chicken, BBQ sauce, onions', price: 320, cost: 110, icon: '🍕' },
            // Sides
            { cat: 'Sides', name: 'French Fries', desc: 'Crispy golden fries', price: 80, cost: 20, icon: '🍟' },
            { cat: 'Sides', name: 'Onion Rings', desc: 'Battered onion rings', price: 90, cost: 25, icon: '🧅' },
            // Drinks
            { cat: 'Drinks', name: 'Cola', desc: 'Chilled cola', price: 50, cost: 15, icon: '🥤' },
            { cat: 'Drinks', name: 'Lemonade', desc: 'Fresh lemonade', price: 60, cost: 10, icon: '🍋' },
            // Desserts
            { cat: 'Desserts', name: 'Chocolate Brownie', desc: 'Warm brownie with fudge', price: 100, cost: 30, icon: '🍫' },
            { cat: 'Desserts', name: 'Vanilla Ice Cream', desc: 'Two scoops', price: 80, cost: 20, icon: '🍦' }
        ];

        let menuCount = 0;
        const itemsMap = {};
        for (const item of menuItemsData) {
            const res = await client.query(`
                INSERT INTO menu_items (restaurant_id, category_id, item_name, description, price, food_cost, icon)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
            `, [restaurantId, catMap[item.cat], item.name, item.desc, item.price, item.cost, item.icon]);
            itemsMap[item.name] = res.rows[0].id;
            menuCount++;
        }

        // 6. Insert Customers
        const customerIds = [];
        for (let i = 1; i <= 5; i++) {
            const custRes = await client.query(`
                INSERT INTO customers (name, phone, email, city)
                VALUES ($1, $2, $3, $4) RETURNING id;
            `, [`Customer ${i}`, `800000000${i}`, `cust${i}@test.com`, 'Silicon Valley']);
            customerIds.push(custRes.rows[0].id);
        }

        // 7. Generate Historical Orders (To Train AI)
        // Let's create strong associations: 
        // 1. Burger + Fries + Cola
        // 2. Pizza + Cola
        let ordersGenerated = 0;
        const now = new Date();

        for (let i = 0; i < 150; i++) {
            const custId = customerIds[Math.floor(Math.random() * customerIds.length)];
            const orderDate = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

            // Randomly choose a pattern
            const pattern = Math.random();
            const orderItems = [];

            if (pattern < 0.4) {
                // Combo 1: Burger + Fries + Cola
                orderItems.push(itemsMap['Cheese Burger']);
                orderItems.push(itemsMap['French Fries']);
                orderItems.push(itemsMap['Cola']);
            } else if (pattern < 0.7) {
                // Combo 2: Pizza + Cola
                orderItems.push(itemsMap['Pepperoni']);
                orderItems.push(itemsMap['Cola']);
                // Maybe a dessert
                if (Math.random() > 0.5) orderItems.push(itemsMap['Chocolate Brownie']);
            } else {
                // Random items
                const itemKeys = Object.keys(itemsMap);
                const count = Math.floor(Math.random() * 3) + 1;
                for (let k = 0; k < count; k++) {
                    const rndItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                    if (!orderItems.includes(itemsMap[rndItem])) {
                        orderItems.push(itemsMap[rndItem]);
                    }
                }
            }

            // Create Order
            let subtotal = 0;
            const itemDetails = [];
            for (const itemId of orderItems) {
                const itemMeta = menuItemsData.find(m => itemsMap[m.name] === itemId);
                subtotal += itemMeta.price;
                itemDetails.push({ id: itemId, price: itemMeta.price, name: itemMeta.name });
            }
            const total = subtotal + 40; // with delivery fee

            const orderRes = await client.query(`
                INSERT INTO orders(customer_id, restaurant_id, order_status, subtotal, delivery_fee, total_price, delivery_address, created_at)
                VALUES($1, $2, 'completed', $3, 40, $4, '123 Fake Street', $5)
                RETURNING id;
            `, [custId, restaurantId, subtotal, total, orderDate]);

            const orderId = orderRes.rows[0].id;

            // Insert matching order items
            for (const d of itemDetails) {
                await client.query(`
                    INSERT INTO order_items(order_id, menu_item_id, quantity, item_price, subtotal, created_at)
            VALUES($1, $2, 1, $3, $3, $4);
            `, [orderId, d.id, d.price, orderDate]);
            }
            ordersGenerated++;
        }

        await client.query('COMMIT');
        console.log(`✅ Successfully seeded: ${menuCount} menu items and ${ordersGenerated} historical orders`);
        console.log('You can now run the AI Analytics algorithms to generate insights!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding database:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase();
