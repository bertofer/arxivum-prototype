'use strict'
let fs = require('fs')
let path = require('path')
let url = require('url')

let koa = require('koa')
let router = require('koa-router')()
let range = require('koa-range')
let parse = require('co-busboy')

let createTorrent = require('create-torrent')

let app = koa()

let torrentCache
// routes
router.post('/upload', function * (next) {
  // multipart upload

  var parts = parse(this)
  var part

  // Each part is just an entry in the form. Allow multiple files
  part = yield parts
  while (part) {
    var stream = fs.createWriteStream('./files/' + part.filename)
    if (part) part.pipe(stream)
    console.log('uploaded %s -> %s', part.filename, stream.path)

    let downloadUrl = {
      protocol: 'http',
      hostname: 'localhost',
      port: 3000,
      pathname: path.join('/files/' + part.filename)
    }

    var opts = {
      name: part.filename,
      createdBy: 'TEST',
      creationDate: Date.now(),
      private: true,
      announceList: [['http://localhost:3000/tracker/']],
      urlList: url.format(downloadUrl)
    }
    try {
      let torrent = yield createTorrentPromise(path.join('./files/', part.filename), opts)

      console.log('torrent created of file ' + part.filename)
      torrentCache = torrent

      this.status = 200
    } catch (err) {
      console.log(err)
    }

    part = yield parts
    // Create torrent of file
  }
})

router.get('/torrent', function * (next) {
  this.body = torrentCache
})

router.get('/files/:file', range, function * (next) {
  this.body = fs.createReadStream(path.join('./files', this.params.file))
})

function createTorrentPromise (filename, opts) {
  return new Promise((resolve, reject) => {
    createTorrent(filename, opts,
    (err, torrent) => {
      if (err) reject(err)
      else resolve(torrent)
    })
  })
}

// Serve client
app.use(require('koa-static')('./client/', {}))
app.use(router.routes())

// Listen
app.listen(3000)
console.log('server listening port 3000')

