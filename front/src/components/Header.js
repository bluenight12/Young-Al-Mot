import React from "react";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";
import { useDispatch, useSelector } from "react-redux";

const flexCenterAlign = css`
  display: flex;
  align-items: center;
`;

const HeaderLabel = styled.div`
  border-bottom: solid;
  height: 40px;
  width: 96%;
  margin-left: 2%;
  margin-right: 2%;
  ${flexCenterAlign}
`;

const LogoLabel = styled.span`
  margin-left: 10px;
  font-size: 20px;
  text-align: left;
`;
const AuthLabel = styled.span`
  font-size: 15px;
  text-align: right;
  justify-self: flex-end;
  margin-right: 10px;
`;

const EmptyLabel = styled.span`
  flex: 1;
  height: 1px;
`;

const LoginLabel = styled.span`
  margin-right: 10px;
`;

const RegisterLabel = styled.span`
  margin-left: 10px;
`;




const Header = () => {
  const { status } = useSelector((state) => state.auth);

  const unLoginView = (
    <AuthLabel>
      <LoginLabel>
        <Link style={{ textDecoration: "none" }} to="/login">
          로그인
        </Link>
      </LoginLabel>
      <RegisterLabel>
        <Link style={{ textDecoration: "none" }} to="/register">
          회원가입
        </Link>
      </RegisterLabel>
    </AuthLabel>
  );
  
  //이미 로그인 되있으면 유저 이름 뜨게
  const loginView = <AuthLabel>{status.currentUser}님</AuthLabel>;

  return (
    <HeaderLabel>
      <LogoLabel>
        <Link style={{ textDecoration: "none" }} to="/">
          영알못
        </Link>
      </LogoLabel>
      <EmptyLabel></EmptyLabel>
      {status.isLoggedIn ? loginView : unLoginView}
    </HeaderLabel>
  );
};

export default Header;
