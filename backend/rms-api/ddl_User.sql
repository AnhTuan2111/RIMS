CREATE TABLE users
(
    user_id       INT AUTO_INCREMENT NOT NULL,
    `role`        VARCHAR(255)       NOT NULL,
    full_name     NVARCHAR(255)      NOT NULL,
    email         VARCHAR(255)       NULL,
    phone         VARCHAR(255)       NOT NULL,
    password_hash VARCHAR(255)       NOT NULL,
    status        BIT(1)             NOT NULL,
    create_at     datetime           NOT NULL,
    update_at     datetime           NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (user_id)
);

ALTER TABLE users
    ADD CONSTRAINT uc_users_phone UNIQUE (phone);