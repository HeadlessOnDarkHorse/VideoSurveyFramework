sub init()
    m.videoPlayer = m.top.findNode("videoPlayer")
    m.statusLabel = m.top.findNode("statusLabel")
    m.videoPlayer.observeField("state", "onVideoStateChange")
    m.top.setFocus(true)
end sub

sub onStreamUrlChange()
    url = m.top.streamUrl
    if url <> "" and url <> invalid
        print "MainScene playing URL: " + url
        m.statusLabel.visible = false

        videoContent = createObject("RoSGNode", "ContentNode")
        videoContent.url = url
        videoContent.streamFormat = "mp4" ' Can be hls, mp4, etc. Defaults to mp4 for simplicity

        m.videoPlayer.content = videoContent
        m.videoPlayer.control = "play"
        m.videoPlayer.setFocus(true)
    end if
end sub

sub onVideoStateChange()
    state = m.videoPlayer.state
    print "Video state changed to: " + state
    if state = "error"
        m.statusLabel.text = "Error playing video"
        m.statusLabel.visible = true
    else if state = "finished"
        m.statusLabel.text = "Video finished. Waiting for new stream..."
        m.statusLabel.visible = true
    end if
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    handled = false
    if press then
        if key = "back"
            if m.videoPlayer.state = "playing" or m.videoPlayer.state = "buffering"
                m.videoPlayer.control = "stop"
                m.statusLabel.visible = true
                m.statusLabel.text = "Waiting for stream URL from Android..."
                m.top.setFocus(true)
                handled = true
            end if
        end if
    end if
    return handled
end function