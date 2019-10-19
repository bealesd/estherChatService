const uuidv1 = require('uuid/v1');
const storage = require('azure-storage');
const config = require('./config.js');
let storageClient;

module.exports = function () {

    this.setup = function () {
        storageClient = storage.createTableService(config.storageAccount, config.storageKey);
    };

    this.getChatRecords = function (recordCount) {
        return this.createTableIfNotExistsPromise()
            .then(function () {
                return this.getRecords(recordCount);
            }.bind(this));

    };

    this.createTableIfNotExistsPromise = function () {
        return new Promise(function (res, rej) {
            storageClient.createTableIfNotExists(config.storageTable, function (error, result) {
                if (error) rej();
                else res();
            });
        });
    };

    this.getRecords = function (recordCount) {
        return new Promise(function (res, rej) {
            let query = new storage.TableQuery().top(10);
            storageClient.queryEntities(config.storageTable, query, null, function (error, result, response) {
                if (error) rej("chatRepo: get records failed");
                let jsonRecords = this.filterRecordsAsJson(result.entries, recordCount);
                console.log(`\nGetting all chat records: ${jsonRecords.length}`);

                res(jsonRecords);
            }.bind(this));
        }.bind(this));
    };

    this.getChatRecordsAfterId = function (lastId) {
        return new Promise(function (res, rej) {
            if (this.isNullString(lastId)) return rej("chatRepo: no id provided");
            let query = new storage.TableQuery().top(10);
            storageClient.queryEntities(config.storageTable, query, null, function (error, result, response) {
                if (error) return rej();
                return res(this.getRecordsAfterId(result.entries, lastId));
            }.bind(this));
        }.bind(this));
    };

    this.isNullString = function (value) {
        return value === null || value === undefined || value === "";
    };

    this.isEmptyArray = function (array) {
        return array === null || array === undefined || array === [] || array.length === 0;
    };


    this.getRecordsAfterId = function (entries, id) {
        jsonArray = [];
        if (this.isEmptyArray(entries)) return jsonArray;
        let storeRecord = false;
        for (let i = entries.length - 1; i >= 0; i--) {
            let entry = entries[i];
            if (storeRecord) jsonArray.push(this.parseRecordToJson(entry));
            if (entry['Id']._ === id) storeRecord = true;
        }
        return jsonArray;
    };

    this.filterRecordsAsJson = function (entries, recordCount) {
        recordCount = Number.isInteger(recordCount) && (recordCount > 0 || recordCount <= 10) ? recordCount : 10;
        if (entries.length < recordCount) recordCount = entries.length;
        let jsonArray = [];
        for (let i = 0; i < recordCount; i++)
            jsonArray.unshift(this.parseRecordToJson(entries[i]));
        return jsonArray;
    };

    this.parseRecordToJson = function (entry) {
        return {
            id: entry.Id._,
            who: entry.Who._,
            datetime: entry.Datetime._,
            content: entry.Content._
        };
    };

    this.addChatRecord = function (message, who) {
        const id = uuidv1();
        const date = new Date();
        const ticks = date.getTime();
        const invertedTimeKey = this.getMaxTimeTicks() - ticks;
        const entity = {
            PartitionKey: `${invertedTimeKey}`,
            RowKey: `${invertedTimeKey}`,
            Id: id,
            Who: who,
            Content: message,
            Datetime: ticks
        };
        return new Promise(function (res, rej) {
            storageClient.insertOrReplaceEntity(config.storageTable, entity, function (error, result, response) {
                if (!error) res(entity);
                rej();
            }.bind(this));
        }.bind(this));
    };

    this.updateOrReplaceRecord = function (entity) {
        return new Promise(function (res, rej) {
            storageClient.insertOrReplaceEntity(config.storageTable, entity, function (error, result, response) {
                if (!error) res(entity.Id);
                rej();
            }.bind(this));
        }.bind(this));
    };

    this.getMaxTimeTicks = function () {
        return (new Date(9999, 12, 31, 23, 59, 59, 9999999)).getTime();
    };
};