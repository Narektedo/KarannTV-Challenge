import React from 'react';
import styled from 'styled-components';

const Button = () => {
  return (
    <StyledWrapper>
      <div className="arrow">
        <div className="arrow-top" />
        <div className="arrow-bottom" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .arrow {
    cursor: pointer;
    height: 60px;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    transition: transform 0.1s;
    width: 50px;
  }

  .arrow-top, .arrow-bottom {
    background-color: #666;
    height: 4px;
    left: -5px;
    position: absolute;
    top: 50%;
    width: 100%;
  }

  .arrow-top:after, .arrow-bottom:after {
    background-color: #fff;
    content: "";
    height: 100%;
    position: absolute;
    top: 0;
    transition: all 0.15s;
  }

  .arrow-top {
    transform: rotate(45deg);
    transform-origin: bottom right;
  }

  .arrow-top:after {
    left: 100%;
    right: 0;
    transition-delay: 0s;
  }

  .arrow-bottom {
    transform: rotate(-45deg);
    transform-origin: top right;
  }

  .arrow-bottom:after {
    left: 0;
    right: 100%;
    transition-delay: 0.15s;
  }

  .arrow:hover .arrow-top:after {
    left: 0;
    transition-delay: 0.15s;
  }

  .arrow:hover .arrow-bottom:after {
    right: 0;
    transition-delay: 0s;
  }

  .arrow:active {
    transform: translateX(-50%) translateY(-50%) scale(0.9);
  }`;

export default Button;
