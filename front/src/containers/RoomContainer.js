import axios from "axios";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { buttons } from "polished";

import RoomChat from "../components/RoomChat";
import RoomOut from "../components/RoomOut";
import { roomOutRequest } from "../modules/room";
import GameReady from "../components/GameReady";
import NowUser from "../components/NowUser";
import { getSocket } from "../socket/SocketFunc";
import { config } from "../config";

import Endword from "../components/Endword";
import AStandFor from "../components/AStandFor";
import HangMan from "../components/HangMan";

const AllContent = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: space-around;
`;

const ChatBodyContent = styled.div`
  display: flex;
  border: 1px solid thin;
  border-radius: 50px;
  margin-left: 10%;
  padding-left: 5%;
  width: 75%;
  margin-top: 1%;
  height: 20%;
  font-size: min(3vw, 100%);
  align-items: center;
`;

const ChatBodyContent2 = styled.div`
  display: flex;
  border: 1px solid thin;
  border-radius: 50px;
  margin-left: 10%;
  font-size: min(3vw, 100%);
  width: 75%;
  margin-top: 0.87%;
  height: 20%;
  align-items: center;
  justify-content: flex-end;
  padding-right: 5%;
`;
const TopContent = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 10%;
  margin-left: 5%;
  width: 90%;
`;
const TopContentLeft = styled.div`
  margin-top: 15%;
`;
const TopContentLeft2 = styled.div`

`;

const TopContentRight = styled.div`
  justify-self: flex-end;
  /* margin-left: 10vw; */
`;
const BodyContent = styled.div`
  margin: 15px;
  min-height: 40%;
`;
const BottomContent = styled.div`
  max-height: 40%;
  min-height: 40%;
  padding-bottom:5%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;
const BotLeft = styled.div`
  flex: 1;
  margin-bottom: 1%;
`;
const BotMid = styled.div`
  height: 95%;
  width: 98%;
  flex: 1.8;
`;
const BotRight = styled.div`
  flex: 1;
  margin-bottom: 1%;
`;

//서버 주소
const socket = getSocket();

const RoomContainer = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.status);
  const room = useSelector((state) => state.room.room);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [allmessage, setAllmessage] = useState("");
  const [isReady, setisReady] = useState(false);
  const [roomUser, setroomUser] = useState([
    { user: user.currentNickname, score: 0, key: 0, ready: 0, master: 1 },
  ]);
  const [isMaster, setisMaster] = useState(0);
  const [gameStart, setgameStart] = useState(0); //이게 1일때 방장이 시작누르면 게임시작할수있음
  const [isStart, setisStart] = useState(0); //게임중인지 아닌지 나타냄(0은 대기방, 1은 게임중, -1은 점수창)
  const [timer, settimer] = useState(0);
  const [round, setround] = useState(1);

  //endword
  const [order, setorder] = useState("");
  const [word, setword] = useState("");
  const [startWord, setstartWord] = useState("");

  //A Stands For
  const [startAlp, setstartAlp] = useState("");
  const [answerList, setanswerList] = useState([]);

  //행맨
  const [alp, setalp] = useState([]);
  const handleChangeMessage = (e) => {
    setMessage(e.target.value);
  };

  //게임준비, 게임시작
  const handleReadyClick = (e) => {
    console.log("click ready");
    if (isMaster) {
      if (gameStart) {
        console.log("aa", gameStart);
        //게임시작 누르면 소켓에 알림(방번호, 게임타입)
        socket.emit("gamestart", room.roomid, room.gametype);
      } else {
        alert("플레이어가 모두 준비를 완료해야 합니다");
      }
    } else {
      axios({
        method: "POST",
        url: `${config.api}/ready`,
        data: {
          nickname: user.currentNickname,
          roomid: room.roomid,
        },
      })
        .then((res) => {
          setisReady(res.data.ready);
        })
        .catch((e) => {
          console.log("서버와 통신에 실패했습니다");
        });
    }
  };

  //msg소켓 보내는거
  //gameanswer소켓 보내는건
  const send = (e) => {
    if (message != "") {
      socket.emit("msg", {
        roomno: room.roomid,
        name: user.currentNickname,
        message: message,
      });
      setMessage("");

      //게임중일때
      if (isStart == 1) {
        if (room.gametype == "끝말잇기") {
          //타이머 존재할때방 정답 전송됨
          if (timer > 0) {
            if (order == user.currentNickname) {
              socket.emit(
                "gameanswer",
                room.roomid,
                message.toLowerCase(),
                order
              );
            }
          }
        } else if (room.gametype == "A Stands For") {
          if (timer > 0) {
            socket.emit(
              "standanswer",
              room.roomid,
              message.toLowerCase(),
              user.currentNickname
            );
          }
        } else {
          //행맨
          if (order == user.currentNickname) {
            let i = 0;
            let isSame = 0;
            for (i = 0; i < alp.length; i++) {
              if (alp[i].alp == message) {
                isSame = 1;
              }
            }
            if (isSame) alert("이미 입력한 알파벳입니다");
            else
              socket.emit(
                "hanganswer",
                room.roomid,
                message.toLowerCase(),
                order
              );
          }
        }
      }
    }
  };

  //'socketConection'이벤트
  useEffect(() => {
    //새로고침하면 방 나가게 됨
    //새로고침으로 리듀서 초기화되면 roomid 0되니까 그거이용
    if (room.roomid == 0) {
      history.push("/roomList");
    }

    //뒤로가기 막는거
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      history.go(1);
    };

    //창 닫거나 새로고침할때 이벤트
    window.onbeforeunload = (e) => {
      e.returnValue = "";
      return "";
    };

    //ctrl+w했을때 이벤트
    window.onkeydown = logKey;
    function logKey(e) {
      if (e.ctrlKey && e.key === "w") {
        dispatch(roomOutRequest(user.currentUser));
      }
    }

    //서버가 갱신되어서 소켓id가 바뀔경우를 위해 이렇게함
    //소켓연결이 되면 서버에서 'socketConection'이벤트가오고
    //그럼 클라이언트에서는 유저id를 보내줌
    socket.off("socketConection");
    socket.on("socketConection", (val) => {
      if (val) socket.emit("socketin", user.currentUser);
    });
  });

  //msg소켓
  useEffect(() => {
    console.log("roomcontainer mount");
    //msg소켓 받는거
    socket.on("msg", (obj) => {
      console.log("msg");
      if (sessionStorage.count == 0) {
        sessionStorage.setItem("count", 1);
      } else {
        sessionStorage.setItem("count", 0);
      }
      console.log(sessionStorage.count + "count");
      const logs2 = logs;
      obj.key = "key_" + (logs.length + 1);
      logs2.unshift(obj); // 로그에 추가하기
      setLogs(logs2);
      const tmp = logs.map((e) => {
        if (user.currentNickname == e.name) {
          return (
            <ChatBodyContent2
              key={e.key}
              style={{ backgroundColor: "#aaafca" }}
            >
              {e.message}
            </ChatBodyContent2>
          );
        } else if (e.name == "System") {
          return (
            <ChatBodyContent key={e.key} style={{ backgroundColor: "#8E88BF" }}>
              {e.name} : {e.message}
            </ChatBodyContent>
          );
        } else {
          return (
            <ChatBodyContent key={e.key} style={{ backgroundColor: "white" }}>
              {e.name} : {e.message}
            </ChatBodyContent>
          );
        }
      });

      setAllmessage(tmp);
    });
  }, [logs]);

  //join 소켓
  //roomUser관리(레디,점수,방장.입장,퇴장 이 바뀔때 업데이트됨)
  useEffect(() => {
    //join이벤트 받으면 소켓에서 현재 유저정보 받아서 배열로 만들어서 넣어줘
    //ready해도 여기서 처리함 (ready 0은 레디 안한거 1은 레디한거)
    socket.off("join"); //왜인지 모르겟지만 2번 실행되길레 한번 꺼줌(어디서 실행되는지 모르겟음)
    socket.on("join", (val) => {
      //val에 roomuser정보 받아옴
      console.log("join", val);
      let tmp = [];
      let readynum = 0;
      for (let i = 0; i < val.length; i++) {
        let nowname = val[i].user_name;

        if (val[i].ready) readynum += 1;
        if (val[i].master == 1 && user.currentNickname == val[i].user_name) {
          console.log("getmaster");
          setisMaster(1);
        }
        tmp.push({
          user: nowname,
          score: val[i].score,
          key: i,
          ready: val[i].ready,
          master: val[i].master,
        });
      }
      //일단 혼자있을때는 시작안되게했음
      if (readynum == val.length - 1 && readynum != 0) setgameStart(1);
      else setgameStart(0);

      if (tmp.length != 0) setroomUser(tmp);
    });
  }, [roomUser]);

  const roomOut = () => {
    socket.disconnect();
    socket.emit("disconnect",user.currentNickname);
    history.push("/roomList");
  };

  const game = () => {
    if (room.gametype == "끝말잇기") {
      return (
        <Endword
          message={message}
          word={word}
          startWord={startWord}
          round={round}
          timer={timer}
          roomUser={roomUser}
          isStart={isStart}
          settimer={settimer}
          setround={setround}
          setstartWord={setstartWord}
          setword={setword}
          setorder={setorder}
          setisStart={setisStart}
          setgameStart={setgameStart}
          setroomUser={setroomUser}
          readybutton={readybutton}
          setisReady={setisReady}
          count={room.count}
        />
      );
    } else if (room.gametype == "A Stands For") {
      return (
        <AStandFor
          message={message}
          timer={timer}
          startAlp={startAlp}
          nickname={user.currentNickname}
          roomUser={roomUser}
          isStart={isStart}
          answerList={answerList}
          round={round}
          settimer={settimer}
          setstartAlp={setstartAlp}
          setisStart={setisStart}
          setgameStart={setgameStart}
          setroomUser={setroomUser}
          setanswerList={setanswerList}
          setround={setround}
          readybutton={readybutton}
          setisReady={setisReady}
        />
      );
    } else {
      //행맨
      return (
        <HangMan
          message={message}
          roomUser={roomUser}
          isStart={isStart}
          round={round}
          word={word}
          order={order}
          alp={alp}
          setroomUser={setroomUser}
          setisStart={setisStart}
          setgameStart={setgameStart}
          setround={setround}
          setword={setword}
          setorder={setorder}
          setalp={setalp}
          readybutton={readybutton}
          setisReady={setisReady}
        />
      );
    }
  };

  const readybutton = () => {
    if (isStart) {
      return;
    } else {
      return (
        <GameReady
          isMaster={isMaster}
          isReady={isReady}
          handleReadyClick={handleReadyClick}
        />
      );
    }
  };

  return (
    <AllContent>
      <TopContent>
        <TopContentLeft>
          <NowUser roomUser={roomUser} order={order} />
        </TopContentLeft>
        <TopContentRight>
          <RoomOut roomOut={roomOut} />
        </TopContentRight>
      </TopContent>
      <BodyContent>{game()}</BodyContent>
      <BottomContent>
        <BotLeft></BotLeft>
        <BotMid>
          <RoomChat
            user={user}
            message={message}
            roomid={room.roomid}
            handleChangeMessage={handleChangeMessage}
            send={send}
            setLogs={setLogs}
            allmessage={allmessage}
          />
        </BotMid>
        <BotRight></BotRight>
      </BottomContent>
    </AllContent>
  );
};

export default RoomContainer;
