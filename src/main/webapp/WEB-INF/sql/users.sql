create table t_users(
    id number primary key,	--seq
    user_id varchar2(50) not null unique,
    pw varchar2(50) not null,
    email varchar2(50) unique not null,
    name varchar2(50) not null,
    phone_num varchar2(20),
    addr varchar2(500),
    state varchar2(20) default 'active',
    join_date date default sysdate
);

create sequence seq_users
start with 1
increment by 1
nocache
nocycle;

CREATE TABLE t_email_verification (
    email VARCHAR2(100) PRIMARY KEY,
    code VARCHAR2(10) NOT NULL,
    created_at DATE DEFAULT SYSDATE
);