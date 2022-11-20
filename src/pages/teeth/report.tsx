import request from "@/service/request";
import { GetQueryString } from "@/service/utils";
import Voice from "@/static/icons/voice.svg";
import Female from "@/static/imgs/female.png";
import Male from "@/static/imgs/male.png";
import Tishi from "@/static/imgs/weixintishi.png";
import React, { useEffect, useRef, useState } from "react";
import styles from "./report.module.less";

const resultColor = {
  1: "#0051EF",
  2: "#FF6B00",
  3: "#FF0000",
};

const resultspanColor = {
  未发现龋齿情况: "#1DA1F2",
  牙齿存在轻度龋齿: "#1DA1F2",
  牙齿存在中度龋齿: "#FF6B00",
  牙齿存在重度龋齿: "#FF0000",
};

const canvasWidth = 300;

export default function App() {
  //   console.log("🚀 ~ file: report.tsx ~ line 26 ~ App ~ props", props)
  const [data, setData] = useState<any>({});
  const canvasBox = useRef();
  const [teethList, setTeethList] = useState<any>([]);

  const getAttr = async () => {
    const response = await request({
      url: "/check/get",
      data: { id: GetQueryString("id") || 125 },
    });
    setData(response.data);
  };

  useEffect(() => {
    sessionStorage.token = GetQueryString("token");
    setTimeout(() => {
      getAttr();
    });
  }, []);

  const renderCanvas = async (v, i) => {
    console.log("🚀 ~ file: report.tsx ~ line 74 ~ renderCanvas ~ v", v);
    const canvasNode = document.getElementById(
      `canvas${i}`
    ) as HTMLCanvasElement;
    const ctx = canvasNode?.getContext("2d");
    const img = new Image();
    // 等待图片加载
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = v.imageUrl; // 要加载的图片 url
    });
    canvasNode.width = img.width;
    canvasNode.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    v.imageResults.forEach((c) => {
      if (c.score > 0.8) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = resultColor[c.result];
        ctx.strokeRect(
          c.bbox[0],
          c.bbox[1],
          c.bbox[2] - c.bbox[0],
          c.bbox[3] - c.bbox[1]
        );
      }
    });
    ctx.scale(1.5, 1.5);
  };

  const calcCanvasSize = async (arr) => {
    for (let v of arr) {
      const img = new Image();
      // 等待图片加载
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = v.imageUrl; // 要加载的图片 url
      });
      v.canvasW = canvasWidth;
      v.scale = canvasWidth / img.width;
      v.canvasH = img.height * v.scale;
    }
    console.log("🚀 ~ file: report.tsx ~ line 81 ~ calcCanvasSize ~ arr", arr);
    setTeethList([...arr]);
    setTimeout(() => {
      arr.forEach((v, i) => {
        renderCanvas(v, i);
      });
    });
  };

  useEffect(() => {
    if (data?.images) {
      calcCanvasSize(data.images);
    }
  }, [data]);

  return (
    <div className="page">
      <div className={styles.body}>
        <div className={styles.tipBox}>
          <div className={styles.tip}>
            <div>
              <span className={styles.name}>{data?.children?.name}</span>
              <img
                className={styles.gender}
                src={data?.children?.gender === 1 ? Male : Female}
              />
              <span className={styles.age}>{data?.children?.age}岁</span>
            </div>
            <span className={styles.time}>{data?.children?.birthday}</span>
          </div>
        </div>
        <div className={styles.content} ref={canvasBox}>
          <div className={styles.result}>
            <div className={styles.title}>
              <span className={styles.label}>检测结果：</span>
              <span
                className={styles.key}
                style={{ color: resultspanColor[data?.result] }}
              >
                {data?.result}
              </span>
            </div>
            <div className={styles.card}>
              <div className={styles.head}>治疗方案</div>
              <div className={styles.resultBody}>
                <div>{data?.treatment}</div>
                <div className={styles.desc}>
                  <img className={styles.icon} src={Voice} />
                  （检测范围：4～12岁，年龄范围超过检测结果可能不准确。以上治疗方案为辅助判断，具体方案请以牙科医生加测结果为准）
                </div>
              </div>
            </div>
          </div>
          <div className={styles.refer}>
            <img className={styles.tishi} src={Tishi} />
            <span className={styles.tishitext}>温馨提示</span>
            <div className={styles.chengdu}>
              <div className={styles.item}>轻度龋齿</div>
              <div className={styles.item}>中度龋齿</div>
              <div className={styles.item}>重度龋齿</div>
            </div>
          </div>
          {teethList?.map((v, i) => (
            <div className={styles.teeth} key={i}>
              <div className={styles.title}>{v.positionName}</div>
              <div className={styles.teethImgBox}>
                <canvas
                  id={`canvas${i}`}
                  style={{ width: v.canvasW, height: v.canvasH }}
                />
                {/* <img src={v.imageUrl}></img> */}
              </div>
            </div>
          ))}
        </div>
        {/* <div className={cls(styles.btn)} onClick={submit}>
          开始检测
        </div> */}
      </div>
    </div>
  );
}
