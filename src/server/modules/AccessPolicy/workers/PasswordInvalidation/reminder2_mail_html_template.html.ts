let template: string = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
  ' <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">' +
  ' ' +
  ' <head>' +
  '     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />' +
  '     <meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
  '     <title>Portfolio - Responsive Email Template</title>' +
  '     <style type="text/css">' +
  '         /* ----- Custom Font Import ----- */' +
  ' ' +
  '         @import url(https://fonts.googleapis.com/css?family=Lato:400,700,400italic,700italic&subset=latin,latin-ext);' +
  ' ' +
  '         /* ----- Text Styles ----- */' +
  ' ' +
  '         table {' +
  '             font-family: "Lato", Arial, sans-serif;' +
  '             -webkit-font-smoothing: antialiased;' +
  '             -moz-font-smoothing: antialiased;' +
  '             font-smoothing: antialiased;' +
  '         }' +
  ' ' +
  '         @media only screen and (max-width: 700px) {' +
  '             /* ----- Base styles ----- */' +
  '             .full-width-container {' +
  '                 padding: 0 !important;' +
  '             }' +
  ' ' +
  '             .container {' +
  '                 width: 100% !important;' +
  '             }' +
  ' ' +
  '             /* ----- Header ----- */' +
  '             .header td {' +
  '                 padding: 30px 15px 30px 15px !important;' +
  '             }' +
  ' ' +
  '             /* ----- Projects list ----- */' +
  '             .projects-list {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .projects-list tr {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .projects-list td {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .projects-list tbody {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .projects-list img {' +
  '                 margin: 0 auto 25px auto;' +
  '             }' +
  ' ' +
  '             /* ----- Half block ----- */' +
  '             .half-block {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .half-block tr {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .half-block td {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .half-block__image {' +
  '                 width: 100% !important;' +
  '                 background-size: cover;' +
  '             }' +
  ' ' +
  '             .half-block__content {' +
  '                 width: 100% !important;' +
  '                 box-sizing: border-box;' +
  '                 padding: 25px 15px 25px 15px !important;' +
  '             }' +
  ' ' +
  '             /* ----- Hero subheader ----- */' +
  '             .hero-subheader__title {' +
  '                 padding: 80px 15px 15px 15px !important;' +
  '                 font-size: 35px !important;' +
  '             }' +
  ' ' +
  '             .hero-subheader__content {' +
  '                 padding: 0 15px 90px 15px !important;' +
  '             }' +
  ' ' +
  '             /* ----- Title block ----- */' +
  '             .title-block {' +
  '                 padding: 0 15px 0 15px;' +
  '             }' +
  ' ' +
  '             /* ----- Paragraph block ----- */' +
  '             .paragraph-block__content {' +
  '                 padding: 25px 15px 18px 15px !important;' +
  '             }' +
  ' ' +
  '             /* ----- Info bullets ----- */' +
  '             .info-bullets {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .info-bullets tr {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .info-bullets td {' +
  '                 display: block !important;' +
  '             }' +
  ' ' +
  '             .info-bullets tbody {' +
  '                 display: block;' +
  '             }' +
  ' ' +
  '             .info-bullets__icon {' +
  '                 text-align: center;' +
  '                 padding: 0 0 15px 0 !important;' +
  '             }' +
  ' ' +
  '             .info-bullets__content {' +
  '                 text-align: center;' +
  '             }' +
  ' ' +
  '             .info-bullets__block {' +
  '                 padding: 25px !important;' +
  '             }' +
  ' ' +
  '             /* ----- CTA block ----- */' +
  '             .cta-block__title {' +
  '                 padding: 35px 15px 0 15px !important;' +
  '             }' +
  ' ' +
  '             .cta-block__content {' +
  '                 padding: 20px 15px 27px 15px !important;' +
  '             }' +
  ' ' +
  '             .cta-block__button {' +
  '                 padding: 0 15px 0 15px !important;' +
  '             }' +
  '         }' +
  '     </style>' +
  ' ' +
  '     <!--[if gte mso 9]><xml>' +
  ' 			<o:OfficeDocumentSettings>' +
  ' 				<o:AllowPNG/>' +
  ' 				<o:PixelsPerInch>96</o:PixelsPerInch>' +
  ' 			</o:OfficeDocumentSettings>' +
  ' 		</xml><![endif]-->' +
  ' </head>' +
  ' ' +
  ' <body style="padding: 0; margin: 0;" bgcolor="#eeeeee">' +
  '     <!-- <span style="color:transparent !important; overflow:hidden !important; display:none !important; line-height:0px !important; height:0 !important; opacity:0 !important; visibility:hidden !important; width:0 !important; mso-hide:all;">This is your preheader text for this email (Read more about email preheaders here - https://goo.gl/e60hyK)</span> -->' +
  ' ' +
  '     <!-- / Full width container -->' +
  '     <table class="full-width-container" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" bgcolor="#eeeeee"' +
  '         style="width: 100%; height: 100%; padding: 30px 0 30px 0;">' +
  '         <tr>' +
  '             <td align="center" valign="top">' +
  '                 <!-- / 700px container -->' +
  '                 <table class="container" border="0" cellpadding="0" cellspacing="0" width="700" bgcolor="#ffffff" style="width: 700px;">' +
  '                     <tr>' +
  '                         <td align="center" valign="top">' +



  '    <table class="container cta-block" border="0" cellpadding="0" cellspacing="0" width="100%">' +
  '        <tr>' +
  '            <td align="center" valign="top">' +
  '                <table class="container" border="0" cellpadding="0" cellspacing="0" width="620" style="width: 620px;">' +
  '                    <tr>' +
  '                        <td class="cta-block__title" style="padding: 35px 0 0 0; font-size: 26px; text-align: center;">' +
  '                             %%TRAD%%mails.pwd.reminder2.subject%%' +
  '                        </td>' +
  '                    </tr>' +
  '                    <tr>' +
  '                        <td class="cta-block__content" style="padding: 20px 0 27px 0; font-size: 16px; line-height: 27px; color: #969696; text-align: center;">' +
  '                             %%TRAD%%mails.pwd.reminder2.html%%' +
  '                        </td>' +
  '                    </tr>' +


  '                    <tr>' +
  '                        <td align="center">' +
  '                            <table class="container" border="0" cellpadding="0" cellspacing="0">' +
  '                                <tr>' +
  '                                    <td class="cta-block__button" width="230" align="center" style="width: 200px;padding-bottom: 30px">' +
  '                                        <a href="%%ENV%%BASE_URL%%%%ENV%%URL_RECOVERY%%" style="border: 3px solid #eeeeee; color: #969696; text-decoration: none; padding: 15px 45px; text-transform: uppercase; display: block; text-align: center; font-size: 16px;">' +
  '                                           %%TRAD%%mails.pwd.recovery.submit%%' +
  '                                        </a>' +
  '                                    </td>' +
  '                                </tr>' +
  '                            </table>' +
  '                        </td>' +
  '                    </tr>' +

  '                </table>' +
  '            </td>' +
  '        </tr>' +
  '    </table>' +


  '                         </td>' +
  '                     </tr>' +
  '                 </table>' +
  '             </td>' +
  '         </tr>' +
  '     </table>' +
  ' </body>' +
  ' ' +
  ' </html>';
export default template;