var $ = require('jquery')
var http = require('stream-http')

$(document).ready(function () {
  $('#uploadButton').click(function (e) {
    $('#uploadForm').submit(function (e) {
      e.preventDefault()
      $.ajax({
        type: 'POST',
        url: '/upload/',
        data: new window.FormData($(this)[0]),
        processData: false,
        contentType: false,
        success: function () {
          http.get('/torrent/', function (res) {
            var data = []
            res.on('data', function (chunk) {
              data.push(chunk) // Append Buffer object
            })

            res.on('end', function () {
              data = Buffer.concat(data)
              downloadTorrent(data).then(function (torrent) {
                console.log('initiated download? From where? well at least starts webtorrent?')
              })
            })
          })
        }
      })
    })
  })
})

var Webtorrent = require('webtorrent')
var parseTorrent = require('parse-torrent')

var client = new Webtorrent()

function downloadTorrent (torrent) {
  return new Promise((resolve, reject) => {
    client.add(parseTorrent(torrent), function (torrent) {
      resolve(torrent)
    })
  })
}

// function saveFile(file) {

//   var url = file.getBlobURL(function (err, url) {
//     if (err) throw err
//     var a = document.createElement('a')

//     a.target = '_blank'
//     a.download = file.name
//     a.href = url
//     a.textContent = 'Download ' + file.name
//     a.click()
//   })
// }
