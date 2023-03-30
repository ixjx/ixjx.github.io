---
layout: post
title: CFileDialog的用法
tags:
  - MFC
id: 45
categories:
  - 随编
date: 2013-05-31 22:19:43
---

CFileDialog::CFileDialog( BOOL bOpenFileDialog,
LPCTSTR lpszDefExt = NULL,
LPCTSTR lpszFileName = NULL,
DWORD dwFlags = OFN_HIDEREADONLY | OFN_OVERWRITEPROMPT,
LPCTSTR lpszFilter = NULL,
CWnd* pParentWnd = NULL );

参数意义如下：bOpenFileDialog 为TRUE则显示打开对话框，为FALSE则显示保存对话文件对话框。
lpszDefExt 指定默认的文件扩展名。
lpszFileName 指定默认的文件名。
dwFlags 指明一些特定风格。
lpszFilter 是最重要的一个参数，它指明可供选择的文件类型和相应的扩展名。参数格式如：
"Chart Files (*.xlc)|*.xlc|Worksheet Files (*.xls)|*.xls|Data Files (*.xlc;*.xls)|*.xlc; *.xls|All Files (*.*)|*.*||";文件类型说明和扩展名间用 | 分隔，同种类型文件的扩展名间可以用 ; 分割，每种文件类型间用 | 分隔，末尾用 || 指明。

pParentWnd 为父窗口指针。

CString CFileDialog::GetPathName( ) 得到完整的文件名，包括目录名和扩展名如：c:/test/test1.txt
CString CFileDialog::GetFileName( ) 得到完整的文件名，如：test1
CString CFileDialog::GetExtName( ) 得到完整的文件扩展名，如：txt
CString CFileDialog::GetFileTitle ( ) 得到完整的文件名，包括目录名和扩展名如：test1.txt
POSITION CFileDialog::GetStartPosition( ) 对于选择了多个文件的情况得到第一个文件位置。
CString CFileDialog::GetNextPathName( POSITION&amp;amp; pos ) 对于选择了多个文件的情况得到下一个文件位置，并同时返回当前文件名。但必须已经调用过POSITION CFileDialog::GetStartPosition( )来得到最初的POSITION变量。
VC++ CFileDialog 读取多个文件
<!--more -->

试试：
<pre class="brush:c">void CLiulanDlg::OnScan()
{
  // TODO: Add your control notification handler code here
  UpdateData();
  CFileDialog dlg(TRUE,NULL,NULL,OFN_HIDEREADONLY | OFN_OVERWRITEPROMPT,&amp;quot;所有文件 (*.*)|*.*||&amp;quot;,this);
  dlg.m_ofn.lpstrTitle=_T(&amp;quot;打开&amp;quot;);
  if(dlg.DoModal()==IDOK)
  {
    m_strPath = dlg.GetPathName();
    m_strFileName = dlg.GetFileName();

    //打开文件
    CFile file(m_strPath, CFile::modeRead);
    //获取文件大小
    m_dwFileSize = file.GetLength();
    m_strFileSize.Format(&amp;quot;%ld 字节&amp;quot;, m_dwFileSize);
    m_show=m_strFileName+&amp;quot;,&amp;quot;+m_strPath;
    UpdateData(FALSE);
    //关闭文件
    file.Close();
  }
}</pre>
&nbsp;