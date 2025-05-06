---
layout: page
title: Ref
permalink: /ref/
icon: octicon-file-code
isNavItem: true
---

<iframe src="https://ixjx.github.io/ref/" name="myiframe" width="100%" scrolling="no" frameborder="0">
</iframe>

<script>
    function changeFrameHeight(){
        var ifm= document.getElementsByName("myiframe"); 
        for (i=0;i<ifm.length;i++){
            ifm[i].height=document.documentElement.clientHeight-56;
        }
    }
    document.onload=changeFrameHeight();
    window.onresize=function(){changeFrameHeight();}
</script>