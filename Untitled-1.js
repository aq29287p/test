// =======================================
// ============= DO NOT EDIT =============
// =======================================

const { Sequelize, Model, DataTypes, Op } = require("sequelize");
const sequelize = new Sequelize("mysql");
const express = require("express");
const app = express();

const redis = {
    // use it as a real redis client
    get: async function (key) { },
    set: async function (key, value) { },
};

class Teacher extends Model { }

Teacher.init(
    {
        name: DataTypes.STRING,
        deletedAt: DataTypes.DATE,
    },
    { sequelize, modelName: "teacher" }
);

function cacheMarshaller(value) {
    return JSON.stringify(value);
}

function cacheUnMarshaller(value) {
    return JSON.parse(value);
}

function render(res, status, body) {
    res.status(status).send(body);
}

// =========== DO NOT EDIT END ===========
// =======================================
function validate_page(page) {
    if (page === undefined) {
        return false;
    }
    if (typeof page !== 'number') {
        return false;
    }
    if (page < 1) {
        return false;
    }
    return page;
}
function validate_size(size) {
    if (size === undefined) {
        return false;
    }
    if (typeof size !== 'number') {
        return false;
    }
    if (size < 1) {
        return false;
    }
    return size;
}
function validate_withDeleted(withDeleted) {
    if (withDeleted === undefined) {
        return false;
    }
    if (typeof withDeleted !== 'boolean') {
        return false;
    }
    return withDeleted;
}



function getTeacherInfo(page, size, withDeleted) {
    var p, s, w;

    if (!validate_page(page))
        throw "InvalidPageException"
    else
        p = page;
    if (!validate_size(size))
        throw "InvalidSizeException"
    else
        s = size;
    if (!validate_withDeleted(withDeleted))
        throw "InvalidwithDeletedException"
    else
        w = withDeleted;
    return (p, s, w);
}
function logError(err) {
    console.log(err);
}

app.get("/admin/teachers", async function (req, res) {
    let page = parseInt(req.query.page, 10);
    let size = parseInt(req.query.size, 10);
    let withDeleted = Boolean(req.query.deleted);
    try {

        getTeacherInfo(page, size, withDeleted)
    }

    catch (e) {
        switch (e) {
            case "InvalidPageException": {
                bad_page_handler(e)
                break;
            }
            case "InvalidSizeException": {
                bad_size_handler(e)
                break;
            }
            case "InvalidwithDeletedException": {
                bad_withDeleted_handler(e)
                break;
            }
            default: {
                logError(e)
                break;
            }
        }

    }

    try {

        let cache = await redis.get(`${page}-${size}-${withDeleted}`);
        if (!Boolean(cache)) {
            const offset = size * (page - 1);
            const query = {
                where: {},
                limit: size,
                offset: offset,
            };

            if (withDeleted) {
                query.where.deletedAt = { [Op.ne]: null };
            }
            let teachers = await Teacher.findAll(query);
            redis.set(cacheMarshaller(teachers));
        }
        else {
            const teachers = cacheUnMarshaller(cache);
        }
        render(200, { teachers });
    }
    catch (err) {
        render(500, { message: err.message });
    }







