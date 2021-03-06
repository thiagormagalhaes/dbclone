#!/usr/bin/env node
const async = require('async')

const fsBackend = require('./backends/fs')
const mongoBackend = require('./backends/mongo')
const resolveSelections = require('./utils/resolveSelections')

/**
 * Actual logic to count collections
 *
 * @param {opts.collections} array list of collections to count
 * @param {opts.connection} MongoDBClient an instance of MongoDB client connected to DB
 * @param {callback} function A standard callback with function(err) signature
 */
function countDocuments(opts, callback) {
  const list = opts.collections;
  const dbConn = opts.connection;

  if (!dbConn) {
    return callback('MongoDBClient must be provided to countDocuments method.');
  }

  function count(collection, cb) {
    if (collection == '')
      return cb(null, 0)

    if (!collection)
      return cb('> Missing collection name in call to count method')

    return mongoBackend.countDocuments(dbConn, collection, (err, value) => {

      if (err) {
        return cb(err)
      }

      console.log('------------------')
      console.log("Collection: " + collection)
      console.log("Documents : " + value)
      console.log('------------------')

      return cb(null, value)
    });
  }

  return async.eachLimit(list, 1, count, (countErr, value) => {

    if (countErr) {
      return callback(countErr)
    }

    console.log('------------------')
    console.log('Finished count data to Mongo')
    console.log('------------------')
    mongoBackend.close(dbConn)
    return callback()
  });
}

/**
 * Main count function
 *
 * @param {opts.host} string Database host
 * @param {opts.db} string Database name
 * @param {opts.collection} string Database collection
 * @param {callback} function A standard callback with function(err) signature
 */
function main(opts, callback) {
  if (!opts || !opts.host || !opts.db) {
    throw new Error('"host" and "db" must be provided');
  }

  if (typeof callback !== 'function') {
    throw new Error('"callback" must be provided');
  }

  mongoBackend.open(opts.host, opts.db, (connErr, connDb) => {
    if (connErr) {
      console.error('Couldn\'t connect to specified MongoDB', connErr);
      return process.exit(2);
    }

    const newOpts = {
      collections: opts.collections,
      connection: connDb
    };

    return countDocuments(newOpts, callback)
  });
}

module.exports = main;
