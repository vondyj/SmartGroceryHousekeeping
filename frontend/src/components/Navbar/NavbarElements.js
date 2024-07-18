// Adapted from https://www.geeksforgeeks.org/how-to-create-a-multi-page-website-using-react-js/
// Retrieved July 10, 2024

import { NavLink as Link } from "react-router-dom";
import styled from "styled-components";
 
export const Nav = styled.nav`
    background: #f3e5ab;
    height: 80px;
    display: flex;
    justify-content: space-between;
    padding: 0.2rem calc((100vw - 1000px) / 2);
    z-index: 12;
`;
 
export const NavLink = styled(Link)`
    color: #000080;
    display: flex;
    align-items: center;
    float: left;
    font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
    text-decoration: none;
    padding: 0 1rem;
    height: 50px;
    cursor: pointer;
    &.active {
        background: white;
    }
`;
 
export const LoginLogout = styled(Link)`
    color: #f3e5ab;
    background-color: #000080;
    border: none;
    text-decoration: none;
    display: inline-block;
    text-align: center;
    float: right;
    position: absolute;
    right: 15px;
    padding: 15px 30px;
    cursor: pointer;
    border-radius: 5px;
    font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
`;
 
export const NavMenu = styled.div`
    display: flex;
    align-items: center;
    margin-left: 24px;
    /* Second Nav */
    /* margin-right: 24px; */
    /* Third Nav */
    /* width: 100vw;
    white-space: nowrap; */
    @media screen and (max-width: 768px) {
        display: none;
    }
`;
