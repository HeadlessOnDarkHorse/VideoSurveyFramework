sub Main(args as Dynamic)
    print "Starting Android to Roku Bridge"

    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.setMessagePort(m.port)

    scene = screen.CreateScene("MainScene")
    screen.show()

    ' Check if we received a deep link (streamUrl) on launch
    if args <> invalid and args.streamUrl <> invalid
        print "Received streamUrl on launch: "; args.streamUrl
        scene.streamUrl = args.streamUrl
    end if

    ' Listen for roInputEvent in case of ECP while app is running
    Input = CreateObject("roInput")
    Input.SetMessagePort(m.port)

    while(true)
        msg = wait(0, m.port)
        msgType = type(msg)

        if msgType = "roSGScreenEvent"
            if msg.isScreenClosed() then return
        else if msgType = "roInputEvent"
            if msg.IsInput()
                info = msg.GetInfo()
                if info.streamUrl <> invalid
                    print "Received streamUrl via ECP: "; info.streamUrl
                    scene.streamUrl = info.streamUrl
                end if
            end if
        end if
    end while
end sub