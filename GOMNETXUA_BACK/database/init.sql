USE inventory_db;

CREATE TABLE product_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,

    group_code VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(255) NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,

    product_group_id INT NOT NULL,

    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,

    size VARCHAR(50),

    purchase_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_quantity INT NOT NULL DEFAULT 0,
    min_stock_quantity INT NOT NULL DEFAULT 0,

    status ENUM('active', 'inactive')
        NOT NULL DEFAULT 'active',

    image_url VARCHAR(500),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_group
        FOREIGN KEY (product_group_id)
        REFERENCES product_groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);