import request from '@/service/request';
import VideoRecorder from '@jbleach/react-video-recorder';
import MediaStreamRecorder from 'msr';
import * as qiniu from 'qiniu-js';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';

function mergeProps(mergein, mergeto) {
  for (var t in mergeto) {
    if (typeof mergeto[t] !== 'function') {
      mergein[t] = mergeto[t];
    }
  }
  return mergein;
}

function Recorder({ close, uploadCb }) {
  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(240);
  const recorder = useRef<any>();
  const mediaRecorder = useRef<any>();
  const [status, setStatus] = useState<'start' | 'pause' | 'stop'>('stop');
  const blobs = useRef([]);
  const buffers = useRef([]);
  const buffersFilled = useRef(0);
  const allowRecord = useRef(false);
  const videoFile = useRef();

  useEffect(() => {
    setWidth(document.body.clientWidth);
    setHeight(document.body.clientHeight);
  }, []);

  function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(successCallback)
      .catch(errorCallback);
  }

  function onMediaSuccess(stream) {
    console.log('success~~~~~~~');
    let video = document.createElement('video');
    video = mergeProps(video, {
      controls: true,
      muted: true,
      width: `${width}`,
      height: `${height - 100}`,
    });

    video.srcObject = stream;
    // video.play();

    recorder.current.appendChild(video);

    mediaRecorder.current = new MediaStreamRecorder(stream);
    mediaRecorder.current.stream = stream;
    mediaRecorder.current.mimeType = 'video/webm';

    // don't force any mimeType; use above "recorderType" instead.
    // mediaRecorder.mimeType = 'video/webm'; // video/webm or video/mp4

    mediaRecorder.current.videoWidth = width;
    mediaRecorder.current.videoHeight = height;
    mediaRecorder.current.ondataavailable = (blob) => {
      console.info('blob', blob);
      if (allowRecord.current) {
        blobs.current.push(blob);
      }
      // upload2Server(blob);
      // var a = document.createElement('a');
      // a.target = '_blank';
      // a.innerHTML = 'Open Recorded Video No. ' + (index++) + ' (Size: ' + bytesToSize(blob.size) + ') Time Length: ' + getTimeLength(timeInterval);

      // a.href = URL.createObjectURL(blob);

      // videosContainer.appendChild(a);
      // videosContainer.appendChild(document.createElement('hr'));
    };

    // get blob after specific time interval
    mediaRecorder.current.start(2000);
  }

  function onMediaError(e) {
    console.error('media error', e);
  }

  function isBuffersDone() {
    buffersFilled.current++;
    console.log(
      '🚀 ~ file: index.tsx ~ line 87 ~ isBuffersDone ~ buffersFilled.current',
      buffersFilled.current,
    );
    if (buffersFilled.current >= blobs.current.length) {
      var result = spliceBuffers();

      //*****************
      // result is the spliced together buffers that could be given to unrar.js
      console.log(99999, result);
    }
  }

  function spliceBuffers() {
    var tmpResult = new Uint8Array();

    for (var i = 0; i < blobs.current.length; i++) {
      tmpResult = appendBuffer(tmpResult, blobs.current[i]);
    }

    return tmpResult;
  }

  function appendBuffer(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp;
  }

  const start = () => {
    if (status !== 'start') {
      captureUserMedia(
        {
          audio: false, // record both audio/video in Firefox/Chrome
          video: true,
        },
        onMediaSuccess,
        onMediaError,
      );
      allowRecord.current = true;
      blobs.current = [];
      buffers.current = [];
      buffersFilled.current = 0;
    } else {
      mediaRecorder.current.resume();
    }
    setStatus('start');
  };

  const concatBuffer = () => {
    console.log('bbb', blobs.current, blobs.current.length);
    for (var i = 0; i < blobs.current.length; i++) {
      buffers.current.push(new Uint8Array());
    }

    for (var i = 0; i < blobs.current.length; i++) {
      console.log('i', i);
      var fileReader = new FileReader();

      fileReader.onload = (function (i, fileReader) {
        return function () {
          buffers.current[i] = fileReader.result;
          isBuffersDone();
        };
      })(i, fileReader);
      fileReader.readAsArrayBuffer(blobs.current[i]);
    }
  };

  const stop = () => {
    mediaRecorder.current.stop();
    allowRecord.current = false;
    setStatus('stop');
    concatBuffer();
    close();
  };

  const pause = () => {
    mediaRecorder.current.pause();
    setStatus('pause');
  };

  const upload2Server = async (blob) => {
    const fileName = 'msr-' + new Date().toISOString().replace(/:|\./g, '-') + '.webm';
    const file = new File([blob], fileName, {
      type: 'video/webm',
    });
    const param = { ext: 'webm', type: 2 };
    const { data } = await request({ url: '/upload/token', data: param });
    const { key, token, bucket } = data;
    const putExtra = {};
    const config: any = {
      // uphost: 'dqqn.fushuhealth.com',
      // upprotocol: 'http',
      quality: 0.92,
      noCompressIfLarger: true,
    };
    const observer = {
      next(res) {
        // ...
      },
      error(err) {
        // ...
      },
      complete: async (res) => {
        const { data } = await request({
          url: '/upload/file',
          data: {
            bucket,
            fileName,
            key,
            size: file.size ?? 1,
            type: 2,
          },
          method: 'POST',
        });
        uploadCb({ serverId: data.id }, data);
        // ...
      },
    };
    const observable = qiniu.upload(file, `${bucket}/${key}`, token, putExtra, config);
    observable.subscribe(observer);
    close();
  };

  const confirmFile = () => {
    upload2Server(videoFile.current);
  };

  return (
    <div
      ref={recorder}
      style={{ width: '100vw', height: '100vh' }}
      className={styles.recorder}>
      <VideoRecorder
        onRecordingComplete={(videoBlob) => {
          // upload2Server(videoBlob)
          videoFile.current = videoBlob;
        }}
        onConfirm={() => confirmFile()}
      />
      {/* <video muted={true} controls={false} width={width} height={height}></video> */}
      {/* <div className={styles.btn}>
        {status !== 'start' ? (
          <PlayCircleO fontSize="30px" onClick={start} color="#ffd340" />
        ) : (
          <PauseCircleO fontSize={30} onClick={pause} color="#ffd340" />
        )}
        <StopCircleO
          fontSize="30px"
          onClick={stop}
          color={status === 'pause' || status === 'start' ? '#ffd340' : '#aaaaaa'}
        />
      </div> */}
    </div>
  );
}

export default Recorder;
