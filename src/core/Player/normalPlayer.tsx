/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useRef, useCallback, useState, useEffect } from 'react'
import style from './index.module.scss'
import { getName, prefixStyle, formatPlayTime } from '@/utils'
import SvgIcon from '@/components/SvgIcon'
import { CSSTransition } from 'react-transition-group'
import animations from 'create-keyframe-animation'
import { PlayerProps } from './data'
import '@/styles/global.scss'
import * as actionTypes from '@/store/modules/Player/actionCreators'
import { useSelector, useDispatch } from 'react-redux'
import ProgressBar from '@/components/ProgressBar'
import { storeType } from '@/store/data'
import { playMode } from '@/api/config'
import Scroll from '@/components/Scroll'
import { speedList } from '@/api/config'

function NormalPlayer(props: PlayerProps) {
  const {
    song,
    fullScreen,
    currentTime,
    duration,
    percent,
    mode,
    currentLineNum,
    currentPlayingLyric,
    currentLyric,
  } = props

  const {
    onProgressChange,
    handlePrev,
    handleNext,
    changeMode,
    clickPlaying,
    clickSpeed,
  } = props

  const playing = useSelector((state: storeType) => state.player.playing)
  const speed = useSelector((state: storeType) => state.player.speed)

  const normalPlayerRef = useRef<HTMLDivElement>(null)
  const cdWrapperRef = useRef<HTMLDivElement>(null)

  const transform: any = prefixStyle('transform')

  const [currentState, setCurrentState] = useState<any>(0)
  const lyricScrollRef = useRef<any>(null)
  const lyricLineRefs = useRef<any>([])

  const _getPosAndScale = () => {
    const targetWidth = 40
    const paddingRight = 40
    const paddingBottom = 130
    const paddingTop = 10
    const width = window.innerWidth * 0.8
    const scale = targetWidth / width
    // 两个圆心的横坐标距离和纵坐标距离

    const x = window.innerWidth / 2 + paddingRight
    const y = -(window.innerHeight - paddingTop - width / 2 - paddingBottom)

    return {
      x,
      y,
      scale,
    }
  }

  const enter = () => {
    normalPlayerRef.current!.style.display = 'block'
    const { x, y, scale } = _getPosAndScale()
    const animation = {
      0: {
        transform: `translate3d(${x}px,${y}px,0) scale(${scale})`,
      },
      60: {
        transform: `translate3d(0, 0, 0) scale(1.1)`,
      },
      100: {
        transform: `translate3d(0, 0, 0) scale(1)`,
      },
    }
    animations.registerAnimation({
      name: 'move',
      animation,
      presets: {
        duration: 400,
        easing: 'linear',
      },
    })
    animations.runAnimation(cdWrapperRef.current, 'move')
  }

  const afterEnter = () => {
    const cdWrapperDom = cdWrapperRef.current!
    animations.unregisterAnimation('move')
    cdWrapperDom.style.animation = ''
  }

  const leave = () => {
    if (!cdWrapperRef.current) return
    const cdWrapperDom = cdWrapperRef.current
    cdWrapperDom.style.transition = 'all 0.4s'
    const { x, y, scale } = _getPosAndScale()
    cdWrapperDom.style[
      transform
    ] = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
  }

  const afterLeave = () => {
    if (!cdWrapperRef.current) return
    const cdWrapperDom = cdWrapperRef.current
    cdWrapperDom.style.transition = ''
    cdWrapperDom.style[transform] = ''
    normalPlayerRef.current!.style.display = 'none'
    setCurrentState('')
  }

  const dispatch = useDispatch()

  const toggleFullScreenDispatch = useCallback(() => {
    dispatch(actionTypes.changeFullScreen(false))
  }, [dispatch])

  const togglePlayListDispatch = useCallback(
    (state) => {
      dispatch(actionTypes.changeShowPlayList(state))
    },
    [dispatch],
  )

  const handleTogglePlayList = (e: React.MouseEvent) => {
    togglePlayListDispatch(true)
    e.stopPropagation()
  }

  const clickPlayingCB = useCallback(
    (e) => {
      clickPlaying!(e, !playing)
    },
    [clickPlaying, playing],
  )

  useEffect(() => {
    if (!lyricScrollRef.current) return
    const bScroll = lyricScrollRef.current.getBScroll()

    if (currentLineNum! > 5) {
      const lineEl = lyricLineRefs.current[currentLineNum! - 5].current
      bScroll.scrollToElement(lineEl, 1000)
    } else {
      bScroll.scrollTo(0, 0, 1000)
    }
  }, [currentLineNum])

  const getPlayMode = () => {
    if (mode === playMode.sequence) {
      return <SvgIcon iconClass="player-cycle" />
    } else if (mode === playMode.loop) {
      return <SvgIcon iconClass="player-single" />
    } else if (mode === playMode.random) {
      return <SvgIcon iconClass="player-random" />
    }
  }

  const toggleCurrentState = () => {
    let nextState = ''
    if (currentState !== 'lyric') {
      nextState = 'lyric'
    } else {
      nextState = ''
    }
    setCurrentState(nextState)
  }

  return (
    <CSSTransition
      classNames="normalPlayer"
      in={fullScreen}
      timeout={400}
      mountOnEnter
      onEnter={enter}
      onEntered={afterEnter}
      onExit={leave}
      onExited={afterLeave}
    >
      <div ref={normalPlayerRef} className={style['normal-player-container']}>
        <div className={style['background']}>
          <img
            src={song.al && song.al.picUrl + '?param=300x300'}
            width="100%"
            height="100%"
            alt="歌曲图片"
          />
        </div>
        <div className={`${style['background']} ${style['layer']}`}></div>
        <div className={`${style['top']} top`}>
          <SvgIcon
            iconClass="back"
            className={style['back']}
            onClick={toggleFullScreenDispatch}
          />
          <h1 className={style['title']}>{song.name}</h1>
          <h1 className={style['subtitle']}>{getName(song.ar || [])}</h1>
        </div>

        <div
          ref={cdWrapperRef}
          className={style['middle']}
          onClick={toggleCurrentState}
        >
          <CSSTransition
            timeout={400}
            classNames="fade"
            in={currentState !== 'lyric'}
          >
            <div
              className={style['CD-wrapper']}
              style={{
                visibility: currentState !== 'lyric' ? 'visible' : 'hidden',
              }}
            >
              <div
                className={`${style['needle']} ${
                  playing ? '' : style['pause']
                }`}
              ></div>
              <div className={style['cd']}>
                <img
                  className={`${style['image']} ${style['play']} ${
                    playing ? '' : style['pause']
                  }`}
                  src={song.al && song.al.picUrl + '?param=400x400'}
                  alt=""
                />
              </div>
              {/* <div className={style['cd']}>
                <img
                  className={`${style['image']} ${style['play']} ${
                    playing ? '' : style['pause']
                  }`}
                  src={song.al && song.al.picUrl + '?param=400x400'}
                  alt=""
                />
              </div> */}
              <p className={style['playing-lyric']}>{currentPlayingLyric}</p>
            </div>
          </CSSTransition>
          <CSSTransition
            timeout={400}
            classNames="fade"
            in={currentState === 'lyric'}
          >
            <div className={style['lyric-container']}>
              <Scroll className={style['scroll-lyric']} ref={lyricScrollRef}>
                <div
                  style={{
                    visibility: currentState === 'lyric' ? 'visible' : 'hidden',
                  }}
                  className={style['lyric-wrapper']}
                >
                  {currentLyric ? (
                    currentLyric.lines.map((item: any, index: number) => {
                      lyricLineRefs.current[index] = React.createRef()
                      return (
                        <p
                          className={`${style['text']} ${
                            currentLineNum === index ? style['current'] : ''
                          }`}
                          key={item + index}
                          ref={lyricLineRefs.current[index]}
                        >
                          {item.txt}
                        </p>
                      )
                    })
                  ) : (
                    <p className={`${style['text']} ${style['pure']}`}>
                      纯音乐，请欣赏。
                    </p>
                  )}
                </div>
              </Scroll>
            </div>
          </CSSTransition>
        </div>

        <div className={`${style['bottom']} bottom`}>
          <div className={style['speed-list']}>
            <span>倍速听歌</span>
            {speedList.map((item) => {
              return (
                <div
                  key={item.key}
                  className={`${style['list-item']} ${
                    speed === item.key ? style['selected'] : ''
                  }`}
                  onClick={() => clickSpeed!(item.key)}
                >
                  {item.name}
                </div>
              )
            })}
          </div>
          <div className={style['progress-wrapper']}>
            <span className={`${style['time']} ${style['time-l']}`}>
              {formatPlayTime(currentTime)}
            </span>
            <div className={style['progress-bar-wrapper']}>
              <ProgressBar percentChange={onProgressChange} percent={percent} />
            </div>
            <div className={`${style['time']} ${style['time-r']}`}>
              {formatPlayTime(duration)}
            </div>
          </div>
          <div className={style['operators']}>
            <div
              className={`${style['icon']} ${style['i-left']}`}
              onClick={changeMode}
            >
              {getPlayMode()}
            </div>
            <div
              className={`${style['icon']} ${style['i-left']}`}
              onClick={handlePrev}
            >
              <SvgIcon iconClass="player-prev" />
            </div>
            <div
              className={`${style['icon']} ${style['i-center']}`}
              onClick={clickPlayingCB}
            >
              {playing ? (
                <SvgIcon iconClass="player-play" />
              ) : (
                <SvgIcon iconClass="player-stop" />
              )}
            </div>
            <div
              className={`${style['icon']} ${style['i-right']}`}
              onClick={handleNext}
            >
              <SvgIcon iconClass="player-next" />
            </div>
            <div
              className={`${style['icon']} ${style['i-right']}`}
              onClick={handleTogglePlayList}
            >
              <SvgIcon iconClass="player-list" />
            </div>
          </div>
        </div>
      </div>
    </CSSTransition>
  )
}

export default NormalPlayer
